# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

### Option 1: Private Email (Preferred for Initial Contact)

Email [hello@yush.dev](mailto:hello@yush.dev) with the subject line:

```
[SECURITY] <brief description>
```

### Option 2: GitHub Security Advisories

Use GitHub's private disclosure tool:
[Report a vulnerability](https://github.com/aayusharyan/lab-map/security/advisories/new)

## What to Include

- Description of the vulnerability
- Steps to reproduce
- Lab Map version affected
- Potential impact or attack scenario

## Response Timeline

- **Acknowledgement**: within 48 hours
- **Triage and severity assessment**: within 7 days
- **Fix timeline**: communicated after triage

Reporters who disclose responsibly will be credited in the release notes.

## Scope

**In scope:**

- The Lab Map web application (rendering, data handling, UI)
- The Docker image (`ghcr.io/aayusharyan/lab-map`)
- JSON schema validation logic in `watcher.js`
- XSS or injection risks from rendered topology data

**Out of scope:**

- Vulnerabilities in your own configuration data or infrastructure
- Issues in third-party packages not introduced by Lab Map
- Security of self-hosted environments running Lab Map
