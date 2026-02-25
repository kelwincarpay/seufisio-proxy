# STEPS-GERAL

Here was specified the flow of general actions on the Seufisio App.

## Authentication

1. All requests needs to be authenticated, to do this, you need to send the `Authorization` header with the value `Bearer <token>`.
2. The token is obtained by making a request to the `./auth.md` specification.
3. Every request needs to authentication before.

## Env Variables

1. User and Password needs to be stored in environment variables, like `SEUFISIO_USER` and `SEUFISIO_PASSWORD`.
2. client_secret needs to be stored in environment variable, like `SEUFISIO_CLIENT_SECRET`.

