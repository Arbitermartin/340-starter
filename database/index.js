// // const { Pool } = require("pg")
// // require("dotenv").config()
// // /* ***************
// //  * Connection Pool
// //  * SSL Object needed for local testing of app
// //  * But will cause problems in production environment
// //  * If - else will make determination which to use
// //  * *************** */
// // let pool
// // if (process.env.NODE_ENV == "development") {
// //   pool = new Pool({
// //     connectionString: process.env.DATABASE_URL,
// //     ssl: {
// //       rejectUnauthorized: false,
// //     },
// // })

// // // Added for troubleshooting queries
// // // during development
// // module.exports = {
// //   async query(text, params) {
// //     try {
// //       const res = await pool.query(text, params)
// //       console.log("executed query", { text })
// //       return res
// //     } catch (error) {
// //       console.error("error in query", { text })
// //       throw error
// //     }
// //   },
// // }
// // } else {
// //   pool = new Pool({
// //     connectionString: process.env.DATABASE_URL,
// //   })
// //   module.exports = pool
// // }


const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Database connected successfully at:', result.rows[0].now);
  });
});

// Export with query logging in development
module.exports = {
  query: (text, params) => {
    console.log('Executing query:', text, params);
    return pool.query(text, params);
  },
  getClient: () => pool.connect(),
};