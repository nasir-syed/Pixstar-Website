// import necessary module 
import { MongoClient } from 'mongodb';


// MongoDB connection URI for local MongoDB instance
const connectionURL = 'mongodb://localhost:27017';

// Function to connect to MongoDB locally and return the collection
export async function connectToMongoDB(databaseName, collectionName) {
    try {
      // Create a new MongoClient
      const client = new MongoClient(connectionURL);
  
      // Connect to MongoDB
      await client.connect();
    
      // Access the specified database
      const database = client.db(databaseName);
  
      // Access the specified collection
      const collection = database.collection(collectionName);
  
      return collection;
    } catch (error) {
      // show any errors that may occur in connecting to mongoDB
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }