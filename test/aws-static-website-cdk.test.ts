import { expect as expectCDK, haveResource, SynthUtils } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AwsStaticWebsiteCdk from '../lib/index';
import { assert } from 'console';

test('Static Website Created', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");

  const previous = cdk.ContextProvider.getValue;
  cdk.ContextProvider.getValue = (_scope: cdk.Construct, options: cdk.GetContextValueOptions) => {
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
  expectCDK(stack).to(haveResource("AWS::S3::Bucket"));
  cdk.ContextProvider.getValue = previous;
});
