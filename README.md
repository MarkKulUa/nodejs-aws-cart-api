# nodejs-aws-cart-api

## Installation

```bash
npm install
```



## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```


## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

### Create user and get auth token

register user with `POST` http://localhost:4000/api/auth/register

Body:
```json
{
  "name": "your_github_login",
  "password": "TEST_PASSWORD"
}
```

**get token** with `POST` http://localhost:4000/api/auth/login

Body
```json
{
  "username": "your_github_login",
  "password": "TEST_PASSWORD"
}
```
Response
```json
{
  "token_type": "Basic",
  "access_token": "eW91ckdpdGh1YkxvZ2luOlRFU1RfUEFTU1dPUkQ="
}

```

**Or you can do it with bash script, make sure you have installed `curl` in your system**

Put content of env.example to .env and **update credentials**:
```bash
cat env.example > .env
```

Create user and get token
```bash
./get-token.sh
```
if command failed make script executable
```bash
chmod +x ./get-token.sh
```


## Task 8 — Deploy (AWS CDK) + PostgreSQL (RDS)

The Nest app is wrapped into a single AWS Lambda (via `@codegenie/serverless-express`)
and deployed with **AWS CDK** behind API Gateway. Persistence is PostgreSQL on RDS
using **TypeORM**. No Serverless Framework is used.

### 1. Configure credentials

Copy `env.example` to `.env` and fill the RDS connection:

```bash
cp env.example .env
```

```
DB_HOST=<your-rds-endpoint>
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<your-password>
DB_NAME=cart
DB_SSL=true
```

`.env` is git-ignored. The CDK app loads it and passes the values to the lambda
environment.

### 2. Deploy

```bash
npm run cdk:deploy
```

Outputs:
- `ApiUrl` — Cart Service base URL
- `LambdaSecurityGroupId` — security group of the lambda

### 3. Let the lambda reach the private RDS

The RDS instance is **private** (no public access). After the first deploy:

1. EC2 → Security Groups → the RDS security group (`cart-db-sg`)
2. Add inbound rule: type **PostgreSQL**, port **5432**, source = the
   `LambdaSecurityGroupId` value from the deploy output.

### 4. Schema + seed

Schema and test data are created automatically by **TypeORM migrations**
(`migrationsRun: true`) the first time the lambda connects. The same SQL is also
stored in `db/init.sql` and `src/database/migrations/`.

### Endpoints

- `GET  /api/profile/cart` — current open cart items
- `PUT  /api/profile/cart` — add/update/remove an item
- `DELETE /api/profile/cart` — clear the open cart
- `PUT  /api/profile/cart/order` — checkout (transactional; sets cart status to `ORDERED`)
- `GET  /api/profile/cart/order` — list orders

All cart endpoints use Basic auth (`Authorization: Basic base64(login:password)`).
