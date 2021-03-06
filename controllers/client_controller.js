
const Client = require('../models/clients.js');

const createClient = async (req, res, next) => {
  try {
    const client = new Client({
      name: req.body.name,
      projects: [],
    });

    const savedClient = await client.save();
    res.status(201).json(savedClient);
  } catch (err) {
    if (err.errors.name.kind === 'unique') {
      const error = new Error('Uh oh, there\'s already a client with this name! THERE CAN ONLY BE ONE!');
      error.status = 409;
      next(error);
    } else {
      const error = new Error(err.message);
      next(error);
    }
  }
};

const getClients = async (req, res, next) => {
  try {
    const clients = await Client.find({});

    if (clients.length) {
      res.status(200).json(clients);
    } else {
      const error = new Error('Clients not found');
      error.status = 404;
      next(error);
    }
  } catch (err) {
    const error = new Error(err.message);
    next(error);
  }
};

module.exports = {
  createClient,
  getClients,
};

