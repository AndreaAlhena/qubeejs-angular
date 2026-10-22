import { Component } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { QUBEE_LIST_ADAPTER, SPATIE_DRIVER, defineList, injectQubeeList, integerParam, stringParam } from '@qubeejs/angular';

import { provideQubeeRouterAdapter } from './provide-qubee-router-adapter';

const articleList = defineList({
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q')
  },
  qubee: { driver: SPATIE_DRIVER },
  resource: 'articles'
});

@Component({ selector: 'lib-articles', template: '' })
class ArticlesComponent {
  public readonly list = injectQubeeList(articleList);

  public readonly pageAtCreation = this.list.state().page;
}

@Component({ selector: 'lib-home', template: '' })
class HomeComponent {}

const setup = async (url: string): Promise<RouterTestingHarness> => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { component: ArticlesComponent, path: 'articles' },
        { canActivate: [() => false], component: HomeComponent, path: 'locked' },
        { component: HomeComponent, path: 'home' }
      ]),
      provideQubeeRouterAdapter()
    ]
  });

  const harness = await RouterTestingHarness.create();

  await harness.navigateByUrl(url);

  return harness;
};

describe('provideQubeeRouterAdapter', () => {
  it('should read the router URL, without the fragment', async () => {
    await setup('/home?panel=edit#top');

    expect(TestBed.inject(QUBEE_LIST_ADAPTER).location()).toEqual({ pathname: '/home', search: '?panel=edit' });
  });

  it('should follow navigations made elsewhere', async () => {
    const harness = await setup('/home');
    const adapter = TestBed.inject(QUBEE_LIST_ADAPTER);

    await harness.navigateByUrl('/articles?page=2');

    expect(adapter.location()).toEqual({ pathname: '/articles', search: '?page=2' });
  });

  it('should give a list in a routed component the URL it was navigated to', async () => {
    const harness = await setup('/home');

    TestBed.inject(QUBEE_LIST_ADAPTER);

    const component = await harness.navigateByUrl('/articles?page=3', ArticlesComponent);

    expect(component.pageAtCreation).toBe(3);
  });

  it('should move back when a navigation is refused', async () => {
    const harness = await setup('/home');
    const adapter = TestBed.inject(QUBEE_LIST_ADAPTER);

    await harness.navigateByUrl('/locked');

    expect(adapter.location().pathname).toBe('/home');
  });

  it('should navigate with navigateByUrl, passing replace as replaceUrl', async () => {
    await setup('/home');

    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigateByUrl').and.callThrough();

    await TestBed.inject(QUBEE_LIST_ADAPTER).navigate('/articles?page=2', { replace: true });

    expect(spy).toHaveBeenCalledWith('/articles?page=2', { replaceUrl: true });
    expect(router.url).toBe('/articles?page=2');
  });

  it('should drive a list end to end', fakeAsync(() => {
    let harness: RouterTestingHarness | undefined;

    setup('/articles?q=react').then((created) => (harness = created));
    flushMicrotasks();

    const component = harness?.routeDebugElement?.componentInstance as ArticlesComponent;

    component.list.setPage(2);

    expect(component.list.isPending()).toBeTrue();

    flushMicrotasks();

    expect(TestBed.inject(Router).url).toBe('/articles?page=2&q=react');
    expect(component.list.isPending()).toBeFalse();
    expect(component.list.request().uri).toContain('page=2');
  }));
});
