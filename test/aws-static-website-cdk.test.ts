import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as AwsStaticWebsiteCdk from '../lib/index';
import { assert } from 'console';

test('Static Website Created', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");

  const previous = cdk.ContextProvider.getValue;
  cdk.ContextProvider.getValue = (_scope: Construct, options: cdk.GetContextValueOptions) => {
    assert(options.provider === 'hosted-zone');
    return {
      value: {
        Id: '12345678',
        Name: 'example.com',
      },
    };
  };


  // WHEN
  new AwsStaticWebsiteCdk.AwsStaticWebsiteCdk(stack, 'MyTestConstruct', {
    domainZoneName: 'example.com',
    recordName: 'www',
    source: [],
    distributionPaths: ['/*'],
    iamCertId: '1234567890',
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResource("AWS::S3::Bucket", {});
  cdk.ContextProvider.getValue = previous;
});
