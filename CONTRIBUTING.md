# Contributing to SecureScan

Thank you for your interest in contributing to SecureScan! We welcome contributions from the community and appreciate your help in making this project better.

## 🤝 How to Contribute

### Reporting Issues

- **Bug Reports**: Use the GitHub issue template to report bugs
- **Feature Requests**: Suggest new features or improvements
- **Security Issues**: Report security vulnerabilities privately to security@example.com

### Development Setup

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/secure-scan.git
   cd secure-scan
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes** and test them:
   ```bash
   npm test
   npm run lint
   ```

6. **Commit your changes**:
   ```bash
   git commit -m "feat: add your feature description"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**

## 📋 Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code formatting

### Testing

- Write tests for new features
- Ensure all tests pass before submitting
- Add test cases for bug fixes
- Maintain test coverage above 80%

### Commit Messages

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for test additions/changes
- `chore:` for maintenance tasks

### Pull Request Guidelines

- Provide a clear description of changes
- Link related issues
- Ensure CI checks pass
- Request reviews from maintainers
- Keep PRs focused and atomic

## 🛠️ Project Structure

```
├── app/                 # Next.js frontend
├── server/             # Express.js backend
├── tests/              # Test files
├── docs/               # Documentation
└── .github/            # GitHub workflows
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/upload.spec.ts
```

### Test Guidelines

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write E2E tests for user workflows
- Mock external dependencies
- Test error scenarios

## 📚 Documentation

- Update README.md for significant changes
- Document new API endpoints
- Add JSDoc comments for functions
- Update CHANGELOG.md for releases

## 🐛 Bug Reports

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
- Screenshots if applicable

## ✨ Feature Requests

For feature requests, please:

- Check existing issues first
- Provide clear use case
- Explain the expected behavior
- Consider implementation complexity

## 🔒 Security

- Report security issues privately
- Don't commit sensitive information
- Follow secure coding practices
- Validate all inputs

## 📞 Getting Help

- Check existing issues and discussions
- Join our community discussions
- Contact maintainers for guidance

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to join the core team (for significant contributions)

Thank you for contributing to SecureScan! 🚀
