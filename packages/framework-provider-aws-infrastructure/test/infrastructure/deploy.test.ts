// /* eslint-disable @typescript-eslint/explicit-function-return-type */
// /* eslint-disable @typescript-eslint/no-magic-numbers */
// import { expect } from '../expect'
// import { replace, restore, fake, match, mock, spy } from 'sinon'
// import { BoosterConfig, Logger } from '@boostercloud/framework-types'
// import { CdkToolkit } from 'aws-cdk/lib/cdk-toolkit'
// import { deploy } from '../../src/infrastructure/deploy'
// import { InfrastructureRocket } from '../../src/rockets/infrastructure-rocket'
// import { EnvironmentUtils } from '@aws-cdk/cx-api'
// import { SdkProvider } from 'aws-cdk'

// const rewire = require('rewire')
// const Infrastructure = rewire('../../src/infrastructure/index')
// const StackTools = rewire('../../src/infrastructure/stack-tools')

// const testEnvironment = {
//   account: 'testAccount',
//   region: 'testRegion',
// }

// describe('the deployment module', () => {
//   beforeEach(() => {
//     replace(SdkProvider.prototype, 'forEnvironment', fake.returns(mock()))
//   })

//   afterEach(() => {
//     restore()
//   })

//   describe('the `deploy` method', () => {
//     it('logs progress through the passed logger', async () => {
//       const config = new BoosterConfig('test')
//       const fakeBootstrapEnvironment = fake.returns({ noOp: true })
//       replace(CdkToolkit.prototype, 'bootstrap', fakeBootstrapEnvironment)
//       replace(CdkToolkit.prototype, 'deploy', fake())
//       const restoreGetEnvironment = StackTools.__set__('getEnvironment', fake.returns(Promise.resolve(testEnvironment)))

//       const logger = ({
//         info: fake(),
//       } as unknown) as Logger

//       await deploy(config, logger)

//       expect(logger.info).to.have.been.called
//       restoreGetEnvironment()
//     })

//     it('logs an error through the passed logger when an error is thrown', async () => {
//       const config = new BoosterConfig('test')
//       const fakeBootstrapEnvironment = fake()
//       const errorMessage = 'Testing error'
//       const fakeCdkDeployThatThrows = fake.throws(errorMessage)
//       replace(CdkToolkit.prototype, 'bootstrap', fakeBootstrapEnvironment)
//       replace(CdkToolkit.prototype, 'deploy', fakeCdkDeployThatThrows)

//       const logger = ({
//         info: fake(),
//         error: fake(),
//       } as unknown) as Logger

//       await expect(Infrastructure.deploy(config, logger)).not.to.eventually.be.rejected
//       // It receives the thrown Error object, not just the message
//       expect(logger.error).to.have.been.calledWithMatch({ message: errorMessage })
//     })

//     it('builds the AppStack calling to the `getStackServiceConfiguration`', async () => {
//       const config = new BoosterConfig('test')
//       const fakeBootstrapEnvironment = fake()
//       replace(CdkToolkit.prototype, 'bootstrap', fakeBootstrapEnvironment)
//       replace(CdkToolkit.prototype, 'deploy', fake())
//       spy(StackTools, 'getStackServiceConfiguration')

//       const logger = ({
//         info: fake(),
//       } as unknown) as Logger

//       await deploy(config, logger)

//       expect(StackTools.getStackServiceConfiguration).to.have.been.calledOnceWith(config)
//     })

//     it('calls the CDK bootstrap with the default environment parameters', async () => {
//       const config = new BoosterConfig('test')
//       const fakeBootstrapEnvironment = fake()

//       replace(CdkToolkit.prototype, 'bootstrap', fakeBootstrapEnvironment)
//       replace(CdkToolkit.prototype, 'deploy', fake())

//       const logger = ({
//         info: fake(),
//       } as unknown) as Logger

//       await deploy(config, logger)

//       expect(fakeBootstrapEnvironment).to.have.been.calledOnce
//       expect(fakeBootstrapEnvironment).to.be.calledWith(
//         match([EnvironmentUtils.format(testEnvironment.account, testEnvironment.region)])
//       )
//     })

//     it('calls the CDK bootstrap with the environment parameters overridden by the configuration') //TODO

//     it('calls the CDK bootstrap with the right config parameters', async () => {
//       const config = new BoosterConfig('test')
//       const testAppName = 'testing'
//       config.appName = testAppName

//       const fakeBootstrapEnvironment = fake()

//       replace(CdkToolkit.prototype, 'bootstrap', fakeBootstrapEnvironment)
//       replace(CdkToolkit.prototype, 'deploy', fake())

//       const logger = ({
//         info: fake(),
//       } as unknown) as Logger

//       await deploy(config, logger)

//       const appNamePrefixRegExp = new RegExp('^' + testAppName + '-')
//       expect(fakeBootstrapEnvironment).to.have.been.calledOnce
//       expect(fakeBootstrapEnvironment).to.be.calledWith(
//         match.any,
//         match.any,
//         match({
//           toolkitStackName: match(appNamePrefixRegExp),
//           parameters: {
//             bucketName: match(appNamePrefixRegExp),
//           },
//         })
//       )
//     })

//     context('with rockets', () => {
//       it('forwards the rockets to the `getStackServiceConfiguration` method for initialization', async () => {
//         const config = new BoosterConfig('test')
//         const fakeBootstrapEnvironment = fake.returns({ noOp: true })
//         replace(CdkToolkit.prototype, 'bootstrap', fakeBootstrapEnvironment)
//         replace(CdkToolkit.prototype, 'deploy', fake())
//         spy(StackTools, 'getStackServiceConfiguration')

//         const logger = ({
//           info: fake(),
//         } as unknown) as Logger

//         const fakeRocket: InfrastructureRocket = {
//           mountStack: fake(),
//           unmountStack: fake(),
//         }

//         await deploy(config, logger, [fakeRocket])

//         expect(StackTools.getStackServiceConfiguration).to.have.been.calledOnceWith(config, [fakeRocket])
//       })
//     })
//   })
// })
