import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

// Ensure all models are registered before tests start
import '../src/models/User.js'
import '../src/models/Company.js'
import '../src/models/Client.js'
import '../src/models/Project.js'
import '../src/models/DeliveryNote.js'

let mongod

export const connect = async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}

export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongod.stop()
}

export const clearDatabase = async () => {
  // Use native driver collections to bypass any Mongoose pre-hooks
  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  await Promise.all(collections.map((c) => db.collection(c.name).deleteMany({})))
}
