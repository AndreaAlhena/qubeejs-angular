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

### General Guidelines

- Use TypeScript strict mode
- Follow Angular style guide conventions
- Use meaningful variable and function names
- Keep functions small and focused

### Naming Conventions

- **Files**: kebab-case (e.g., `query-builder.service.ts`)
- **Classes**: PascalCase (e.g., `QueryBuilderService`)
- **Interfaces**: PascalCase with `I` prefix or descriptive suffix (e.g., `IConfig` or `PaginationConfig`)
- **Variables/Functions**: camelCase (e.g., `buildQuery`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PAGE_SIZE`)

### Linting

ESLint is configured for this project. Run linting before committing:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

A pre-commit hook runs lint-staged automatically on staged files.

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
