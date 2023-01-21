const path = require('path')
const fsPromises = require('fs/promises')
const { fileExists, readJsonFile } = require('../utils/fileHandling')
const { GraphQLError } = require('graphql')
const crypto = require('node:crypto')

const projectDirectory=path.join(__dirname, "..", "data","todos")

exports.resolvers = {
	Query: {
		getTodosById: async (_, args) => {
			const todoId = args.todosId
			// `../data/projects/${projectId}.json`
			const todoFilePath = path.join(__dirname, `../data/todos`)

			const todoExists = await fileExists(todoFilePath)
			if (!todoExists) return new GraphQLError('That project does not exist')

			const todoData = await fsPromises.readFile(todoFilePath, { encoding: 'utf-8' })
			const data = JSON.parse(todoData)
			return data
		},
		getAllTodos: async (_, args) => {
			const todoDirectory = path.join(__dirname, '../data/todos')

			const todos = await fsPromises.readdir(todoDirectory)

			// const projectData = []

			/* for (const file of projects) {
				// console.log(file)
				const filePath = path.join(projectsDirectory, file)
				const fileContents = await fsPromises.readFile(filePath, { encoding: 'utf-8' })
				const data = JSON.parse(fileContents)
				projectData.push(data)
			} */

			const promises = []
			todos.forEach((fileName) => {
				const filePath = path.join(todoDirectory, fileName)
				promises.push(readJsonFile(filePath))
			})

			const todoData = await Promise.all(promises)
			return todoData
		},
	},
	Mutation: {
		createTodos: async (_, args) => {
			//verify name
			if (args.task.length === 0) return new GraphQLError('Name most be at least 1 character long')

			//skapa ett unikt id + data object

			//const projectId= crypto.randomUUID

			const newTodo = {
				id: crypto.randomUUID(),
				task: args.task,
				isDone: args.isDone || '',
			}

			let filePath = path.join(__dirname, '..', 'data', 'todos', `${newTodo.id}.json`)

			let idExists = true

			while (idExists) {
				const exists = await fileExists(filePath)
				console.log(exists, newTodo.id)
				idExists = exists
				if (exists) {
					newTodo.id = crypto.randomUUID()
					let filePath = path.join(__dirname, '..', 'data', 'todos', `${newTodo.id}.json`)
				}
				idExists = exists
			}

			//skapa en fil för projektet i /data/projects

			await fsPromises.writeFile(filePath, JSON.stringify(newTodo))

			//skapa våran respons
			return newTodo

			/* return{

				id:"eat",
				tasks:"eat",
				isDone:false

			} */
		},
		updateTodos: async (_, args) => {
			//hämta alla parametrar från args

			/* const todoId= args.id
			const todoTask= args.task
			const todoIsDone=args.isDone
			*/

			const { id, task, isDone } = args

			//skapa våra filePath

			const filePath = path.join(__dirname, '..', 'data', 'todos', `${id}.json`)

			//finns det projekt som de vill ändra

			//if (no) return not found error

			const todoExists = await fileExists(filePath)

			if (!todoExists) return new GraphQLError('That project does not exist')

			//skapa uppdatedTodo object

			const uppdatedTodo = {
				id,
				task,
				isDone,
			}

			//Skriv över den gamla filen med nya infon

			await fsPromises.writeFile(filePath, JSON.stringify(uppdatedTodo))

			//return uppdatedTodo

			return uppdatedTodo
		},

		deleteTodos: async (_, args) => {
			//get project id

			const todoId = args.todoId

			const filePath = path.join(__dirname, '..', 'data', 'todos', `${todoId}.json`)

			//does this project exist?

			//if no (return error)

			const todoExists = await fileExists(filePath)

			if (!todoExists) return new GraphQLError('That project does not exist')

			//Delete file
			await fsPromises.unlink(filePath)

			

			return {
				deletedId: todoId,
				success: true,
			}
		},
	},
}
