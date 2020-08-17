import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53targets from '@aws-cdk/aws-route53-targets';

export interface AwsStaticWebsiteCdkProps {
  /**
   * The name of domain zone, e.g. example.com.
   */
  domainZoneName: string;
  /**
   * The record name of website domain, e.g. www.
   */
  recordName: string;
  /**
   * The source of s3 bucket.
   */
  source: s3Deployment.ISource[];
  /**
   * The paths to invalidate when source changes.
   */
  distributionPaths: string[];
  /**
   * The ID of iam certificate
   */
  iamCertId: string;
}

export class AwsStaticWebsiteCdk extends cdk.Construct {
  public readonly queueArn: string;

  constructor(scope: cdk.Construct, id: string, props: AwsStaticWebsiteCdkProps) {
    super(scope, id);

    const hostName = `${props.recordName}.${props.domainZoneName}`;

    const bucket = new s3.Bucket(this, 'WebBucket', {
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      bucketName: hostName,
    })

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'Distribution', {
      originConfigs: [{
        customOriginSource: {
          domainName: bucket.bucketWebsiteDomainName,
          originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
        },
        behaviors: [{
          isDefaultBehavior: true
        }]
      }],
      viewerCertificate: cloudfront.ViewerCertificate.fromIamCertificate(
        props.iamCertId,
        {
          aliases: [hostName]
        }
      ),
      httpVersion: cloudfront.HttpVersion.HTTP2,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL
    })

    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.domainZoneName
    });

    new route53.ARecord(this, 'ARecord', {
      zone,
      recordName: props.recordName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      ttl: cdk.Duration.minutes(5),
    })

    const deployment = new s3Deployment.BucketDeployment(this, "DeployWebsite", {
      sources: props.source,
      destinationBucket: bucket,
      distribution,
      distributionPaths: props.distributionPaths,
      retainOnDelete: false,
      storageClass: s3Deployment.StorageClass.INTELLIGENT_TIERING,
      cacheControl: [s3Deployment.CacheControl.setPublic(), s3Deployment.CacheControl.maxAge(cdk.Duration.hours(1))]
    });
  }
}
