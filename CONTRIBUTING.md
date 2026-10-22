# Contributing to @qubeejs/angular

Thank you for your interest in contributing to `@qubeejs/angular`! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js `^22.22.3 || ^24.15.0 || >=26.0.0` (the range Angular 22 requires)
- npm 9+

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/qubeejs-angular.git
   cd qubeejs-angular
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run tests to verify setup:
   ```bash
   npm test -- --browsers=ChromeHeadless --watch=false
   ```

## Code Style

This package follows the coding standards of `@qubeejs/core` —
[CODING-STANDARDS.md](https://github.com/AndreaAlhena/qubeejs-core/blob/develop/CODING-STANDARDS.md)
is the reference. In short:

- **Files**: kebab-case, with a suffix that states the kind (`*.type.ts`, `*.error.ts`, `*.spec.ts`); one kind of declaration per file
- **Types**: data shapes are `type`s without a prefix (e.g., `QubeeConfig`); an `I`-prefixed `interface` only when a class implements it
- **Members**: `private` members carry a leading `_` (`_store`); `protected` and `public` members never do
- **Constants**: UPPER_SNAKE_CASE for literal values and `InjectionToken`s (`QUBEE_DRIVER`), camelCase for anything computed at runtime
- **Types are explicit**: no `any`, explicit return types, `import type` for type-only imports
- **Ordering**: imports and class members alphabetical — ESLint sorts them, never reorder by hand
- **JSDoc** on every exported class, function, method and type
- Angular specifics: signals over RxJS, `inject()` over constructor injection, `Qubee`-prefixed injectables without a `Service` suffix

### Checking your work

```bash
npm run format            # Prettier, including sorted JSON keys
npm run lint              # ESLint (lint:fix applies the auto-fixes)
npm run test:conventions  # File-layout rules ESLint cannot express
```

CI runs all three. A pre-commit hook runs Prettier and ESLint on staged files.

## Testing Requirements

- All new features must include tests
- All bug fixes must include a regression test
- Maintain or improve code coverage
- Tests should be descriptive and follow the pattern:

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once with coverage
npm test -- --browsers=ChromeHeadless --watch=false --code-coverage

# Run tests in Firefox
npm test -- --browsers=Firefox
```

## Pull Request Guidelines

### Before Submitting

1. Create a feature branch from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Ensure all tests pass
4. Ensure linting passes
5. Update documentation if needed

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(pagination): add support for cursor-based pagination
fix(filters): handle empty array values correctly
docs: update README with new API examples
```

### PR Checklist

- [ ] Tests added/updated
- [ ] Linting passes
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow conventional commits
- [ ] Branch is up to date with `master`

### Review Process

1. Submit your PR against `master`
2. Ensure CI checks pass
3. Request review from maintainers
4. Address any feedback
5. Once approved, your PR will be merged

## Reporting Issues

When reporting bugs, please include:

- Qubee version
- Angular version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Any relevant code snippets or error messages

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
