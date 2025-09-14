// Test plugin with security issues
console.log("Test plugin loaded");

// This should trigger a critical security issue
eval("console.log('This is dangerous')");

// This should trigger a SQL injection warning
const query = "SELECT * FROM users WHERE id = " + userId;

// This should trigger a path traversal warning
const filePath = "../" + userInput;

// This should trigger a hardcoded secret warning
const apiKey = "sk-1234567890abcdef";

// This should trigger an XSS warning
document.innerHTML = userContent;

// This should trigger a command injection warning
exec("rm -rf " + userInput);
