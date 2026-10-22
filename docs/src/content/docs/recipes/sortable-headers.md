---
title: Sortable table headers
description: Column headers that sort a list in the URL with toggleSort(), announce it with getAriaSort(), and keep multi-column sorts like sort=-publishedAt,title.
---

A data table sorts by clicking its column headers: once for ascending, again for descending. Getting it right takes more than flipping a flag. The header must be a control a keyboard can reach, only one column may tell assistive technology that it sorts the table, and a sort over several columns (`?sort=-publishedAt,title`) must not behave strangely when one of its secondary columns is clicked. A list declared with a `sortParam` gives `injectQubeeList()` a `toggleSort()` that handles the clicks, and the core's `getAriaSort()` handles the announcement.

## The problem

A first attempt finds the clicked field among the current sorts and flips it:

```typescript
@Component({
  selector: 'app-naive-table',
  template: `
    <th [attr.aria-sort]="ariaSort('title')" (click)="sortBy('title')">Title</th>
  `
})
export class NaiveTableComponent {
  protected readonly list = injectQubeeList(articleList);

  protected sortBy(field: string): void {
    const current = this.list.state().sort.find((sort) => sort.field === field);
    const order = current?.order === SortEnum.ASC ? SortEnum.DESC : SortEnum.ASC;

    this.list.set({ sort: [{ field, order }] });
  }

  protected ariaSort(field: string): string {
    const current = this.list.state().sort.find((sort) => sort.field === field);

    return current ? (current.order === SortEnum.ASC ? 'ascending' : 'descending') : 'none';
  }
}
```

It compiles, and it goes wrong in three ways:

- **The header isn't a control.** A `<th>` with a click handler can't be focused or activated from the keyboard, and isn't announced as something that can be pressed.
- **A secondary sort flips on its first click.** At `?sort=-publishedAt,title` the table is sorted by date, newest first, with title as the tie-breaker. The Title header already reports `ascending`, so a user who clicks it to sort by title gets `?sort=-title`: Z to A on the first click.
- **Two columns claim to sort the table.** Both Published and Title report a direction, but ARIA expects `aria-sort` on one header at a time. And because `field` is a `string`, a typo such as `'titel'` compiles. The list reads it back as an unknown sort and falls back to the default.

## The solution

Declare the sortable fields once, with a default. The examples use the Spatie driver, which sends the sorts on as `sort=-publishedAt,title`:

```typescript title="article-list.ts"
import { SPATIE_DRIVER, SortEnum, defineList, integerParam, sortParam } from '@qubeejs/angular';

export const articleList = defineList({
  apply: (builder, { sort }) => {
    builder.setLimit(20);
    sort.forEach(({ field, order }) => builder.addSort(field, order));
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    sort: sortParam('sort', {
      default: [{ field: 'publishedAt', order: SortEnum.DESC }],
      fields: ['author', 'publishedAt', 'title']
    })
  },
  qubee: { baseUrl: 'https://api.example.com', driver: SPATIE_DRIVER },
  resource: 'articles'
});
```

Each header holds a `<button>` that calls `toggleSort()`, and the `<th>` carries `aria-sort`:

```typescript title="article-table.component.ts"
import { Component } from '@angular/core';
import { SortEnum, getAriaSort, injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { articleList } from './article-list';

type Article = { author: string; id: number; publishedAt: string; title: string };

type Column = { field: 'author' | 'publishedAt' | 'title'; label: string };

@Component({
  selector: 'app-article-table',
  template: `
    <table [attr.aria-busy]="articles.isLoading()">
      <caption>
        Articles
      </caption>
      <thead>
        <tr>
          @for (column of columns; track column.field) {
            <th scope="col" [attr.aria-sort]="getAriaSort(list.state().sort, column.field)">
              <button type="button" (click)="list.toggleSort(column.field)">
                {{ column.label }}
                <span aria-hidden="true">{{ indicator(column.field) }}</span>
              </button>
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (article of articles.value()?.data; track article.id) {
          <tr>
            <td>{{ article.title }}</td>
            <td>{{ article.author }}</td>
            <td>{{ article.publishedAt }}</td>
          </tr>
        }
      </tbody>
    </table>
  `
})
export class ArticleTableComponent {
  protected readonly getAriaSort = getAriaSort;

  protected readonly columns: readonly Column[] = [
    { field: 'title', label: 'Title' },
    { field: 'author', label: 'Author' },
    { field: 'publishedAt', label: 'Published' }
  ];

  protected readonly list = injectQubeeList(articleList);
  protected readonly articles = qubeeHttpResource<Article>(this.list.request);

  /** A visual arrow for every sorted column; screen readers get aria-sort instead */
  protected indicator(field: Column['field']): string {
    const sort = this.list.state().sort.find((candidate) => candidate.field === field);

    if (!sort) {
      return '';
    }

    return sort.order === SortEnum.ASC ? '▲' : '▼';
  }
}
```

Provide the router adapter and `HttpClient` as for any list:

```typescript title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideQubeeRouterAdapter } from '@qubeejs/angular/router';

import { ArticleTableComponent } from './article-table.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([{ path: 'articles', component: ArticleTableComponent }]),
    provideQubeeRouterAdapter(),
    provideHttpClient()
  ]
};
```

### What the clicks do

Starting from `/articles?sort=-publishedAt,title`, which requests `…/articles?limit=20&page=1&sort=-publishedAt,title`:

| Click | URL | `aria-sort`: Title · Author · Published |
| --- | --- | --- |
| (start) | `?sort=-publishedAt,title` | none · none · descending |
| Title | `?sort=title` | ascending · none · none |
| Title | `?sort=-title` | descending · none · none |
| Published | `?sort=publishedAt` | none · none · ascending |
| Published | (no `sort`: back to the default) | none · none · descending |

## Why it works

- **Only the primary sort flips.** `toggleSort(field)` flips a field only when it is the *primary* sort, the first one. Any other field, even one already in the sort as a tie-breaker, starts ascending and becomes the only sort. So the first click on a column always means "sort by this".
- **Only the primary sort is announced.** `getAriaSort(sorts, field)` returns `'ascending'` or `'descending'` for the primary sort and `'none'` for every other column, sorted or not. The arrows are `aria-hidden`, so they don't repeat what `aria-sort` already says.
- **The button is the control.** It is focusable, works with Enter and Space, and is announced as a button; the sort state sits on its column header. The click handler lives on the button, not on the `<th>`.
- **The fields are typed.** `toggleSort()` exists only on a list with exactly one `sortParam`, and its `field` is typed to that param's fields: `list.toggleSort('titel')` is a compile error.
- **One click, one navigation.** `toggleSort()` writes the new sort through `set()`: one history entry, back to page 1 (a new order makes the old page number meaningless), and one fetch, since `request` changes once.
- **The URL stays canonical and safe.** Sorts equal to the default stay out of the URL, so the last click above leaves a plain `/articles`. A hand-edited `?sort=-views` (not a declared field), `?sort=title,-title` (a field twice) or a repeated `sort` key reads back as the default rather than reaching the API.

## Variations

### Shift-click to sort by several columns

Pass `multiple` to keep the other sorts: the field then flips in place wherever it is, or is appended ascending. Shift-click is a common gesture for it. When more than one column is sorted, show the order visually as well, since `aria-sort` announces only the first:

```typescript title="multi-sort-header.component.ts"
import { Component } from '@angular/core';
import { SortEnum, getAriaSort, injectQubeeList } from '@qubeejs/angular';

import { articleList } from './article-list';

type Field = 'author' | 'publishedAt' | 'title';

@Component({
  selector: 'app-multi-sort-header',
  template: `
    <th scope="col" [attr.aria-sort]="getAriaSort(list.state().sort, 'title')">
      <button type="button" (click)="sort('title', $event)">
        Title
        <span aria-hidden="true">{{ position('title') }}</span>
      </button>
    </th>
  `
})
export class MultiSortHeaderComponent {
  protected readonly getAriaSort = getAriaSort;
  protected readonly list = injectQubeeList(articleList);

  protected sort(field: Field, event: MouseEvent): void {
    this.list.toggleSort(field, { multiple: event.shiftKey });
  }

  /** "1▼", "2▲"… — where the column sits in the sort, when it is sorted */
  protected position(field: Field): string {
    const sorts = this.list.state().sort;
    const index = sorts.findIndex((sort) => sort.field === field);

    if (index < 0) {
      return '';
    }

    return `${index + 1}${sorts[index].order === SortEnum.ASC ? '▲' : '▼'}`;
  }
}
```

From the default sort, the clicks give:

| Click | URL |
| --- | --- |
| Shift + Title | `?sort=-publishedAt,title` |
| Shift + Title | `?sort=-publishedAt,-title` |
| Title | `?sort=title` |

Touch screens have no Shift key. If sorting by several columns matters to your users, offer it some other way as well, such as an "Add to sort" control that calls `toggleSort(field, { multiple: true })`.

### URL names that differ from the API's

A record in `fields` maps URL tokens to API fields, so the address bar can say `?sort=-newest` while the API receives `sort=-published_at`. State and `toggleSort()` always use the API name:

```typescript title="renamed-list.ts"
import { SPATIE_DRIVER, SortEnum, defineList, integerParam, sortParam } from '@qubeejs/angular';

export const renamedList = defineList({
  apply: (builder, { sort }) => {
    sort.forEach(({ field, order }) => builder.addSort(field, order));
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    sort: sortParam('sort', {
      default: [{ field: 'published_at', order: SortEnum.DESC }],
      fields: { newest: 'published_at', title: 'title' }
    })
  },
  qubee: { baseUrl: 'https://api.example.com', driver: SPATIE_DRIVER },
  resource: 'articles'
});
```

```html
<button type="button" (click)="list.toggleSort('published_at')">Date</button>
```

### A "default order" button

`set()` with `undefined` returns a param to its default, in one navigation:

```html
<button type="button" (click)="list.set({ sort: undefined })">Default order</button>
```

## Related

- [Lists in the URL](/guide/lists/#what-the-handle-gives-you): `toggleSort()`, `set()` and the rest of the handle
- [Pagination controls](/recipes/pagination-controls/): the page bar under the table
- [Fetching data](/guide/fetching-data/#fetching-a-list): `qubeeHttpResource()`
- [Sortable column headers ↗](https://qubeejs.andreatantimonaco.me/guide/pagination/#sortable-column-headers): `toggleSort()` and `getAriaSort()` in the core
- [Lists & URL state ↗](https://qubeejs.andreatantimonaco.me/guide/lists/#params): `sortParam()` and its options
