# Security Policy

## Supported Scope

This repository is a starter workflow and reference implementation. Security reports are most useful when they involve:

- exposed secrets or unsafe defaults
- command execution risks
- unsafe file handling
- contribution-agent abuse paths
- data leakage in sanitization or export logic
- cross-site scripting or injection risks in the demo/public app pattern

## Reporting

Do not report sensitive issues through a public issue if the report includes:

- credentials
- tokens
- private URLs
- personal data
- unpublished infrastructure details

Instead, contact the maintainer through a private channel and include:

1. affected file or module
2. impact summary
3. reproduction steps
4. proof-of-concept only if necessary
5. suggested mitigation if available

## Handling Expectations

- reports should be reproducible
- reports should stay scoped to this repository or its documented starter patterns
- fixes should preserve sanitization and portability goals

## Hardening Rule For Contributors

When contributing:

- never commit secrets
- never commit local machine paths
- never commit real production credentials
- avoid embedding deployment assumptions as fixed defaults
