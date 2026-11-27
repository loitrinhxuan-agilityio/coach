import { App } from 'aws-cdk-lib'
import { SpineStack } from '../lib/spine-stack.js'

// Nothing here deploys. `cdk synth` writes a template and stops; the first deploy is change 9017,
// after the Owner has answered ADR 0007's two open questions.
const app = new App()
new SpineStack(app, 'AiLiftCoachSpine')
