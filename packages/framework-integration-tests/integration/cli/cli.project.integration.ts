import path = require('path')
import util = require('util')
import * as chai from 'chai'
import { readFileContent } from '../helper/fileHelper'
import * as fs from 'fs'
import { ChildProcess, ExecException } from 'child_process'
// The Booster CLI version used should match the integration tests' version
const BOOSTER_VERSION = require('../../package.json').version

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const expect = chai.expect

const exec = util.promisify(require('child_process').exec)

const PROJECT_NAME_FIXTURE_PLACEHOLDER = 'project_name_fixture_placeholder'
const TEST_TIMEOUT = 80000
const DOWN_KEY = '\u001b[B'
const DESCRIPTION = 'cart-demo'
const VERSION = '1.0.0'
const AUTHOR = 'The Agile Monkeys'
const HOMEPAGE = 'https://www.booster.cloud/'
const LICENSE = 'MIT'
const REPO_URL = 'https://github.com/boostercloud/booster/'
const PROVIDER = '@boostercloud/framework-provider-aws'
const CART_DEMO_SHORT_FLAGS = 'cart-demo-short-flags'
const CART_DEMO_LONG_FLAGS = 'cart-demo-long-flags'
const CART_DEMO_COMMAND_PROMPT = 'cart-demo-command-prompt'
const CART_DEMO_INVALID_PROVIDER = 'cart-demo-invalid-provider'
const CART_DEMO_CUSTOM_PROVIDER = 'cart-demo-custom-provider'
const CART_DEMO_FLAGS_AND_COMMAND_PROMPT = 'cart-demo-flags-and-command-prompt'

export const CLI_PROJECT_INTEGRATION_TEST_FOLDERS: Array<string> = [
  CART_DEMO_SHORT_FLAGS,
  CART_DEMO_LONG_FLAGS,
  CART_DEMO_COMMAND_PROMPT,
  CART_DEMO_INVALID_PROVIDER,
  CART_DEMO_CUSTOM_PROVIDER,
  CART_DEMO_FLAGS_AND_COMMAND_PROMPT,
]

describe('Project', () => {
  // Required by Github actions CI/CD, because it doesn't have git configured
  before(async () => {
    await exec('git config --global user.name || git config --global user.name "Booster Test"')
    await exec('git config --global user.email || git config --global user.email "test@booster.cloud"')
  })
  const cliPath = path.join('..', 'cli', 'bin', 'run')
  const expectedOutputRegex = new RegExp(
    /(.+) boost (.+)?new(.+)? (.+)\n- Creating project root\n(.+) Creating project root\n- Generating config files\n(.+) Generating config files\n- Installing dependencies\n(.+) Installing dependencies\n(.+) Initializing git repository\n(.+) Initializing git repository\n(.+) Project generated!\n/
  )

  const sendToStdin = (childProcess: ChildProcess, promptAnswers: Array<string>, delay: number): void => {
    let currentRepetitions = 0
    const totalRepetitions = promptAnswers.length
    let answers: Array<string> = promptAnswers.slice()

    const intervalID = setInterval(() => {
      childProcess.stdin?.write(answers[0])
      answers = answers.slice(1)

      if (++currentRepetitions === totalRepetitions) {
        clearInterval(intervalID)
      }
    }, delay)
  }

  const execNewProject = (
    projectName: string,
    promptAnswers: Array<string> = [],
    flags: Array<string> = []
  ): Promise<string> => {
    return new Promise<string>((resolve, reject): void => {
      const childProcess = require('child_process').exec(
        `${cliPath} new:project ${projectName} ${flags.join(' ')}`,
        (error: ExecException | null, stdout: string) => {
          childProcess.stdin.end()
          if (error) {
            reject(error)
            return
          }
          resolve(stdout)
        }
      )

      if (promptAnswers.length > 0) {
        sendToStdin(childProcess, promptAnswers, 1000)
      }
    })
  }

  const packageJsonAssertions = (
    expectedJson: string,
    jsonContent: string,
    objectsToCompareJustKeys: Array<string>,
    checkKeysAndValues = true
  ): void => {
    const expectedJsonObj = JSON.parse(expectedJson)
    const jsonContentObj = JSON.parse(jsonContent)

    Object.entries(expectedJsonObj).forEach(([key]) => {
      if (objectsToCompareJustKeys.includes(key)) {
        expect(Object.prototype.hasOwnProperty.call(jsonContentObj, key)).true
        return packageJsonAssertions(
          JSON.stringify(expectedJsonObj[key]),
          JSON.stringify(jsonContentObj[key]),
          objectsToCompareJustKeys,
          false
        )
      } else {
        checkKeysAndValues
          ? expect(jsonContentObj[key]).to.deep.equals(expectedJsonObj[key])
          : expect(Object.prototype.hasOwnProperty.call(jsonContentObj, key)).true
      }
    })
  }

  const assertions = async (stdout: string, projectName: string): Promise<void> => {
    const CART_DEMO_CONFIG = `${projectName}/src/config/config.ts`
    const CART_DEMO_INDEX = `${projectName}/src/index.ts`
    const CART_DEMO_ESLINT_IGNORE = `${projectName}/.eslintignore`
    const CART_DEMO_ESLINT_RC = `${projectName}/.eslintrc.js`
    const CART_DEMO_GIT_IGNORE = `${projectName}/.gitignore`
    const CART_DEMO_PRETTIER_RC = `${projectName}/.prettierrc.yaml`
    const CART_DEMO_PACKAGE_JSON = `${projectName}/package.json`
    const CART_DEMO_TS_CONFIG_ESLINT = `${projectName}/tsconfig.eslint.json`
    const CART_DEMO_TS_CONFIG = `${projectName}/tsconfig.json`

    expect(stdout).to.match(expectedOutputRegex)

    expect(fs.existsSync(`${projectName}/node_modules`)).true
    expect(fs.existsSync(`${projectName}/package-lock.json`)).true
    expect(fs.existsSync(`${projectName}/.git`)).true
    expect(fs.readdirSync(`${projectName}/src/commands`).length).equals(0)
    expect(fs.readdirSync(`${projectName}/src/common`).length).equals(0)
    expect(fs.readdirSync(`${projectName}/src/config`).length).equals(1)
    expect(fs.readdirSync(`${projectName}/src/entities`).length).equals(0)
    expect(fs.readdirSync(`${projectName}/src/events`).length).equals(0)

    const expectedCartDemoConfig = readFileContent('integration/fixtures/cart-demo/src/config/config.ts')
    const cartDemoConfigContent = readFileContent(CART_DEMO_CONFIG)
    expect(cartDemoConfigContent).to.equal(
      expectedCartDemoConfig.replace(PROJECT_NAME_FIXTURE_PLACEHOLDER, projectName)
    )

    const expectedCartDemoIndex = readFileContent('integration/fixtures/cart-demo/src/index.ts')
    const cartDemoIndexContent = readFileContent(CART_DEMO_INDEX)
    expect(cartDemoIndexContent).to.equal(expectedCartDemoIndex)

    const expectedCartDemoEslintIgnore = readFileContent('integration/fixtures/cart-demo/.eslintignore')
    const cartDemoEslintIgnoreContent = readFileContent(CART_DEMO_ESLINT_IGNORE)
    expect(cartDemoEslintIgnoreContent).to.equal(expectedCartDemoEslintIgnore)

    const expectedCartDemoEslintRc = readFileContent('integration/fixtures/cart-demo/.eslintrc.js')
    const cartDemoEslintRcContent = readFileContent(CART_DEMO_ESLINT_RC)
    expect(cartDemoEslintRcContent).to.equal(expectedCartDemoEslintRc)

    const expectedCartDemoGitIgnore = readFileContent('integration/fixtures/cart-demo/.gitignore')
    const cartDemoGitIgnoreContent = readFileContent(CART_DEMO_GIT_IGNORE)
    expect(cartDemoGitIgnoreContent).to.equal(expectedCartDemoGitIgnore)

    const expectedCartDemoPretierRc = readFileContent('integration/fixtures/cart-demo/.prettierrc.yaml')
    const cartDemoPretierRcContent = readFileContent(CART_DEMO_PRETTIER_RC)
    expect(cartDemoPretierRcContent).to.equal(expectedCartDemoPretierRc)

    const expectedCartDemoPackageJson = readFileContent('integration/fixtures/cart-demo/package.json')
    const cartDemoPackageJsonContent = readFileContent(CART_DEMO_PACKAGE_JSON)
    packageJsonAssertions(
      expectedCartDemoPackageJson.replace(PROJECT_NAME_FIXTURE_PLACEHOLDER, projectName),
      cartDemoPackageJsonContent,
      ['dependencies', 'devDependencies']
    )
    const cartDemoPackageJsonObject = JSON.parse(cartDemoPackageJsonContent)
    expect(cartDemoPackageJsonObject['dependencies']['@boostercloud/framework-core']).to.equal(`^${BOOSTER_VERSION}`)
    expect(cartDemoPackageJsonObject['dependencies']['@boostercloud/framework-types']).to.equal(`^${BOOSTER_VERSION}`)
    expect(cartDemoPackageJsonObject['devDependencies']['@boostercloud/cli']).to.equal(`^${BOOSTER_VERSION}`)

    const expectedCartDemoTsConfigEslint = readFileContent('integration/fixtures/cart-demo/tsconfig.eslint.json')
    const cartDemoTsConfigEslintContent = readFileContent(CART_DEMO_TS_CONFIG_ESLINT)
    expect(cartDemoTsConfigEslintContent).to.equal(expectedCartDemoTsConfigEslint)

    const expectedCartDemoTsConfig = readFileContent('integration/fixtures/cart-demo/tsconfig.json')
    const cartDemoTsConfigContent = readFileContent(CART_DEMO_TS_CONFIG)
    expect(cartDemoTsConfigContent).to.equal(expectedCartDemoTsConfig)

    await expect(exec('npm run compile', { cwd: projectName })).to.be.eventually.fulfilled
    await expect(exec('npm run lint:check', { cwd: projectName })).to.be.eventually.fulfilled
  }

  context('Valid project', () => {
    describe('using flags', () => {
      it('should create a new project using short flags to configure it, and the project compiles', async () => {
        const projectName = CART_DEMO_SHORT_FLAGS
        const flags = [
          `-a "${AUTHOR}"`,
          `-d "${DESCRIPTION}"`,
          `-H "${HOMEPAGE}"`,
          `-l "${LICENSE}"`,
          `-p "${PROVIDER}"`,
          `-r "${REPO_URL}"`,
          `-v "${VERSION}"`,
        ]
        const stdout = await execNewProject(projectName, [], flags)

        await assertions(stdout, projectName)
      }).timeout(TEST_TIMEOUT)

      it('should create a new project using long flags to configure it, and the project compiles', async () => {
        const projectName = CART_DEMO_LONG_FLAGS
        const flags = [
          `--author "${AUTHOR}"`,
          `--description "${DESCRIPTION}"`,
          `--homepage "${HOMEPAGE}"`,
          `--license "${LICENSE}"`,
          `--providerPackageName "${PROVIDER}"`,
          `--repository "${REPO_URL}"`,
          `--version "${VERSION}"`,
        ]
        const stdout = await execNewProject(projectName, [], flags)

        await assertions(stdout, projectName)
      }).timeout(TEST_TIMEOUT)
    })

    describe('using command prompt', () => {
      it('should create a new project, and the project compiles', async () => {
        const projectName = CART_DEMO_COMMAND_PROMPT
        const promptAnswers = [
          `${DESCRIPTION}\r\n'`,
          `${VERSION}\r\n`,
          `${AUTHOR}\r\n`,
          `${HOMEPAGE}\r\n`,
          `${LICENSE}\r\n`,
          `${REPO_URL}\r\n`,
          '\r\n',
        ]
        const stdout = await execNewProject(projectName, promptAnswers)

        await assertions(stdout, projectName)
      }).timeout(TEST_TIMEOUT)

      it('should create a new project using a custom provider, and the project compiles', async () => {
        const projectName = CART_DEMO_CUSTOM_PROVIDER
        const promptAnswers = [
          `${DESCRIPTION}\r\n'`,
          `${VERSION}\r\n`,
          `${AUTHOR}\r\n`,
          `${HOMEPAGE}\r\n`,
          `${LICENSE}\r\n`,
          `${REPO_URL}\r\n`,
          `${DOWN_KEY}\r\n`,
          `${PROVIDER}\r\n`,
        ]
        const stdout = await execNewProject(projectName, promptAnswers)

        await assertions(stdout, projectName)
      }).timeout(TEST_TIMEOUT)
    })

    describe('using flags and command prompt', () => {
      it('should create a new project, and the project compiles', async () => {
        const projectName = CART_DEMO_FLAGS_AND_COMMAND_PROMPT
        const promptAnswers = [
          `${DESCRIPTION}\r\n'`,
          `${VERSION}\r\n`,
          `${AUTHOR}\r\n`,
          `${HOMEPAGE}\r\n`,
          `${LICENSE}\r\n`,
        ]
        const flags = [`--providerPackageName "${PROVIDER}"`, `--repository "${REPO_URL}"`]
        const stdout = await execNewProject(projectName, promptAnswers, flags)

        await assertions(stdout, projectName)
      }).timeout(TEST_TIMEOUT)
    })
  })

  context('Invalid project', () => {
    describe('missing project name', () => {
      it('should fail', async () => {
        const { stderr } = await exec(`${cliPath} new:project`)

        expect(stderr).to.equal("You haven't provided a project name, but it is required, run with --help for usage\n")
      })
    })

    describe('using an invalid provider', () => {
      it('should fail', async () => {
        const expectedOutputRegex = new RegExp(
          /(.+) boost (.+)?new(.+)? (.+)\n- Creating project root\n(.+) Creating project root\n- Generating config files\n(.+) Generating config files\n- Installing dependencies\n/
        )
        const flags = [
          `--author "${AUTHOR}"`,
          `--description "${DESCRIPTION}"`,
          `--homepage "${HOMEPAGE}"`,
          `--license "${LICENSE}"`,
          '--providerPackageName "invalid-provider"',
          `--repository "${REPO_URL}"`,
          `--version "${VERSION}"`,
        ]
        const stdout = await execNewProject(CART_DEMO_INVALID_PROVIDER, [], flags)

        expect(stdout).to.match(expectedOutputRegex)
      }).timeout(TEST_TIMEOUT)
    })
  })
})
