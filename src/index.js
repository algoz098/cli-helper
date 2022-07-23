#!/usr/bin/env node

import inquirer from 'inquirer';
import figlet from 'figlet';
import { createSpinner } from 'nanospinner';
import dotenv from 'dotenv';
dotenv.config()

async function executeCommand(command) {
    const spinner = createSpinner('Loading command').start()
    let file
    try {
        file = await import(`./commands/${command}.js`)
        spinner.success()
    } catch (error) {
        console.error('execute command', error)
        spinner.error()
        throw error
    }

    await file.default()
    process.exit()
}

async function start () {
    const command = await inquirer.prompt([
        {
          type: 'list',
          name: 'command',
          message: 'What command to run?',
          choices: [
            {
                name: 'Add First and Last number to ZipCode',
                value: 'zipcodesAddFirstLastNumber'
            },
          ],
        },
        {
          type: 'confirm',
          name: 'mongoUri',
          message: 'Use the mongo uri in the env?',
        },
      ])

    if (!command.mongoUri) {
        const mongoUri = await inquirer.prompt([
            {
              type: 'input',
              name: 'uri',
              message: 'Inform mongo uri to be used?',
            },
          ])

        process.env.MONGO_URI = mongoUri.uri
    }

    console.log('Starting...')
    console.log('Mongo URI => ', process.env.MONGO_URI)
    
    return executeCommand(command.command)
}

console.clear()
figlet('CLI Tools', (err, data) => {
    if (err) throw err
    console.log(data)
    start()

})
