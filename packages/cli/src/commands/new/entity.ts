import * as Oclif from '@oclif/command'
import { Script } from '../../common/script'
import Brand from '../../common/brand'
import {
  HasFields,
  HasReaction,
  HasName,
  joinParsers,
  parseName,
  parseFields,
  parseReaction,
  ImportDeclaration,
} from '../../services/generator/target'
import * as path from 'path'
import { generate } from '../../services/generator'
import { templates } from '../../templates'
import { checkItIsABoosterProject } from '../../services/project-checker'

export default class Entity extends Oclif.Command {
  public static description = 'create a new entity'
  public static flags = {
    help: Oclif.flags.help({ char: 'h' }),
    fields: Oclif.flags.string({
      char: 'f',
      description: 'fields that this entity will contain',
      multiple: true,
    }),
    reduces: Oclif.flags.string({
      char: 'p',
      description: 'events that this entity will reduce to build its state',
      multiple: true,
    }),
  }

  public static args = [{ name: 'entityName' }]

  public async run(): Promise<void> {
    return this.runWithErrors().catch(console.error)
  }

  private async runWithErrors(): Promise<void> {
    const { args, flags } = this.parse(Entity)
    const fields = flags.fields || []
    const events = flags.reduces || []
    if (!args.entityName)
      return Promise.reject("You haven't provided an entity name, but it is required, run with --help for usage")
    return run(args.entityName, fields, events)
  }
}

type EntityInfo = HasName & HasFields & HasReaction

const run = async (name: string, rawFields: Array<string>, rawEvents: Array<string>): Promise<void> =>
  Script.init(
    `boost ${Brand.energize('new:entity')} 🚧`,
    joinParsers(parseName(name), parseFields(rawFields), parseReaction(rawEvents))
  )
    .step('Verifying project', checkItIsABoosterProject)
    .step('Creating new entity', generateEntity)
    .info('Entity generated!')
    .done()

function generateImports(info: EntityInfo): Array<ImportDeclaration> {
  const eventsImports: Array<ImportDeclaration> = info.events.map((eventData) => ({
    packagePath: `../events/${eventData.eventName}`,
    commaSeparatedComponents: eventData.eventName,
  }))

  const coreComponents = ['Entity']
  if (info.events.length > 0) {
    coreComponents.push('Reduces')
  }

  return [
    {
      packagePath: '@boostercloud/framework-core',
      commaSeparatedComponents: coreComponents.join(', '),
    },
    {
      packagePath: '@boostercloud/framework-types',
      commaSeparatedComponents: 'UUID',
    },
    ...eventsImports,
  ]
}

const generateEntity = (info: EntityInfo): Promise<void> =>
  generate({
    name: info.name,
    extension: '.ts',
    placementDir: path.join('src', 'entities'),
    template: templates.entity,
    info: {
      imports: generateImports(info),
      ...info,
    },
  })