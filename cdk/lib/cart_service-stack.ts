import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

    const cartLambda = new lambda.Function(this, 'CartServiceFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      // Bundle is built by scripts/build-lambda.mjs (esbuild + decorator
      // metadata) so NestJS dependency injection works after bundling.
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist-lambda')),
      handler: 'index.handler',
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
