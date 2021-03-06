const config = require('../config.js').get(process.env.NODE_ENV);
const request = require('supertest');
const { expect } = require('chai');
const Client = require('../models/clients.js');
const mongoose = require('mongoose');

const app = require('../server.js');

describe('snapshot_request_controller.js', () => {
  before(async () => {
    await mongoose.connect(config.database.uri);
  });

  beforeEach(async () => {
    await Client.remove({});
  });

  after(async () => {
    await mongoose.connection.close();
  });

  describe('updateSnapshotRequests', () => {
    let client;
    let req;

    beforeEach(async () => {
      req = [{ status: 'active', name: 'name1', sequence: 1 },
        { status: 'active', name: 'name2', sequence: 2 }];

      client = new Client({
        name: 'Client',
        projects: [
          {
            name: 'Project',
          },
        ],
      });
    });

    it('should save new snapshot requests for the specified client and project', async () => {
      const savedClient = await client.save();
      const clId = savedClient._id;
      const prId = savedClient.projects[0]._id;

      await request(app)
        .post(`/client/${clId}/project/${prId}/snapshotRequests`)
        .send(req);

      const updatedClient = await Client.findOne({
        _id: savedClient._id,
        'projects._id': savedClient.projects[0]._id,
      });

      expect(updatedClient.projects[0].snapshotRequests).to.have.length(2);
      expect(updatedClient.projects[0].snapshotRequests[0].sequence).to.equal(1);
      expect(updatedClient.projects[0].snapshotRequests[1].name).to.equal('name2');
      expect(updatedClient.projects[0].snapshotRequests[1].status).to.equal('active');
    });

    it('should return a 200 response in JSON format', async () => {
      const savedClient = await client.save();

      const clId = savedClient._id;
      const prId = savedClient.projects[0]._id;

      const response = await request(app)
        .post(`/client/${clId}/project/${prId}/snapshotRequests`)
        .send(req);

      expect(response.statusCode).to.equal(200);
      expect(response.type).to.equal('application/json');
    });

    it('should return saved requests, including with database IDs', async () => {
      const savedClient = await client.save();

      const clId = savedClient._id;
      const prId = savedClient.projects[0]._id;

      const response = await request(app)
        .post(`/client/${clId}/project/${prId}/snapshotRequests`)
        .send(req);

      expect(response.body[0].name).to.equal('name1');
      expect(response.body[1].name).to.equal('name2');

      const updatedClient = await Client.findOne({
        _id: savedClient._id,
      });

      // checking that returned request includes valid database ID
      const savedRequestId = response.body[1]._id;
      expect(updatedClient.projects[0].snapshotRequests.id(savedRequestId).name).to.equal('name2');
    });

    it('should update existing snapshot requests for the specified client and project', async () => {
      client.projects[0].snapshotRequests = req;
      const savedClient = await client.save();

      const clId = savedClient._id;
      const prId = savedClient.projects[0]._id;
      savedClient.projects[0].snapshotRequests[0].name = 'name3';
      savedClient.projects[0].snapshotRequests[1].name = 'name4';
      savedClient.projects[0].snapshotRequests[1].status = 'deleted';
      req = savedClient.projects[0].snapshotRequests;

      await request(app)
        .post(`/client/${clId}/project/${prId}/snapshotRequests`)
        .send(req);

      const updatedClient = await Client.findOne({
        _id: savedClient._id,
        'projects._id': savedClient.projects[0]._id,
      });

      expect(updatedClient.projects[0].snapshotRequests[0].name).to.equal('name3');
      expect(updatedClient.projects[0].snapshotRequests[1].name).to.equal('name4');
      expect(updatedClient.projects[0].snapshotRequests[1].status).to.equal('deleted');
    });
  });

  describe('getSnapshotRequests', () => {
    let client;

    beforeEach(async () => {
      client = new Client({
        name: 'Client',
        projects: [
          {
            name: 'Project',
            snapshotRequests: [{ status: 'active', name: 'name1', sequence: 1 },
              { status: 'deleted', name: 'name2', sequence: 2 }],
          },
        ],
      });
    });

    it('should return a JSON object and 200 success status', async () => {
      const savedClient = await client.save();

      const snapshotRequestsUrl = `/client/${savedClient._id}/project/${savedClient.projects[0]._id}/snapshotRequests`;
      const response = await request(app)
        .get(snapshotRequestsUrl);

      expect(response.statusCode).to.equal(200);
      expect(response.type).to.equal('application/json');
    });

    it('should return only ACTIVE snapshot requests for the specified client and project', async () => {
      const savedClient = await client.save();

      const snapshotRequestsUrl = `/client/${savedClient._id}/project/${savedClient.projects[0]._id}/snapshotRequests`;
      const response = await request(app)
        .get(snapshotRequestsUrl);

      expect(response.body[0].name).to.equal('name1');
      expect(response.body[0].status).to.equal('active');
      expect(response.body.length).to.equal(1);
    });

    it('should return 404 if client or project Id not found', async () => {
      const savedClient = await client.save();

      await Client.deleteOne({ _id: savedClient._id });

      let snapshotRequestsUrl = `/client/${savedClient._id}/project/${savedClient.projects[0]._id}/snapshotRequests`;
      let response = await request(app)
        .get(snapshotRequestsUrl);

      expect(response.statusCode).to.equal(404);

      snapshotRequestsUrl = `/client/${savedClient._id}/project/${savedClient.projects[0]._id}/snapshotRequests`;
      response = await request(app)
        .get(snapshotRequestsUrl);

      expect(response.statusCode).to.equal(404);
    });
  });
});
