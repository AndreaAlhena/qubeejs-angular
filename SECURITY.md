# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x     | :white_check_mark: |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Do not open a public issue for security vulnerabilities.**

Instead, please use [GitHub's private vulnerability reporting](https://github.com/AndreaAlhena/qubeejs-angular/security/advisories/new) to submit your report securely.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Resolution target**: Within 30 days (depending on severity)

### What to Expect

1. You will receive an acknowledgment of your report
2. We will investigate and validate the issue
3. We will work on a fix and coordinate disclosure
4. You will be credited (unless you prefer anonymity)

### Scope

This security policy applies to:

- The ng-qubee npm package
- This GitHub repository

### Out of Scope

- Vulnerabilities in dependencies (report to the respective maintainers)
- Issues in applications using ng-qubee (unless caused by ng-qubee itself)

## Security Best Practices

When using Qubee:

- Keep the package updated to the latest version
- Review query parameters before sending to your API
- Implement proper server-side validation
- Use HTTPS for all API communications

## Acknowledgments

We appreciate the security research community and will acknowledge reporters in our release notes (with permission).
