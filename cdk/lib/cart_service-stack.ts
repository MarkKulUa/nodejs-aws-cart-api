import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';

export interface CartServiceStackProps extends cdk.StackProps {
  /** Database credentials forwarded to the lambda environment. */
  dbEnv: {
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DB_SSL: string;
  };
}

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CartServiceStackProps) {
    super(scope, id, props);

    // Use the default VPC where the RDS instance lives.
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Security group for the lambda. The RDS security group must allow inbound
    // 5432 from this SG (added manually after first deploy — see README).
    const lambdaSg = new ec2.SecurityGroup(this, 'CartLambdaSg', {
      vpc,
      description: 'Cart service lambda security group',
      allowAllOutbound: true,
      securityGroupName: 'cart-lambda-sg',
    });

    const cartLambda = new lambdaNodeJs.NodejsFunction(this, 'CartServiceFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../src/lambda.ts'),
      handler: 'handler',
      functionName: 'cartService',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [lambdaSg],
      allowPublicSubnet: true,
      environment: {
        ...props.dbEnv,
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
        // pg / typeorm rely on optional drivers; keep them bundled.
        nodeModules: ['pg', 'typeorm', 'reflect-metadata'],
        // NestJS lazily requires these optional packages; they are not used by
        // this app, so leave them as external (Nest handles their absence).
        esbuildArgs: {
          '--external:@nestjs/microservices': true,
          '--external:@nestjs/websockets': true,
          '--external:@nestjs/websockets/socket-module': true,
          '--external:@nestjs/microservices/microservices-module': true,
          '--external:class-transformer': true,
          '--external:class-validator': true,
          '--external:@fastify/static': true,
          '--external:cache-manager': true,
          '--external:@nestjs/platform-socket.io': true,
        },
      },
    });

    // API Gateway proxying every request to the Nest app.
    const api = new apiGateway.LambdaRestApi(this, 'CartServiceApi', {
      handler: cartLambda,
      restApiName: 'Cart Service',
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apiGateway.Cors.ALL_ORIGINS,
        allowMethods: apiGateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSg.securityGroupId,
      description:
        'Add inbound PostgreSQL (5432) rule on the RDS security group from this SG',
    });
  }
}
