
/* eslint no-unused-expressions: 0 */

const request = require('supertest');
const Snapshot = require('../models/snapshots.js');
const mongoose = require('mongoose');
const config = require('../config.js').get(process.env.NODE_ENV);
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));

const { expect } = chai;
const app = require('../server.js');

describe('getSnapshots', () => {
  let snapshot;

  beforeEach(() => {
    snapshot = new Snapshot({
      imageURL: 'https://validurl.com',
      comment: 'comment',
    });
  });

  afterEach((done) => {
    mongoose.connection.collections.snapshots.drop(() => {
      done();
    });
  });

  it('should return in JSON format, with 200 status', async () => {
    await snapshot.save();

    const response = await request(app)
      .get('/snapshots');

    expect(response.statusCode).to.equal(200);
    expect(response.type).to.equal('application/json');
  });

  it('should return snapshot from collection', async () => {
    await snapshot.save();

    const response = await request(app)
      .get('/snapshots');

    expect(response.body[0].comment).to.equal(snapshot.comment);
    expect(response.body[0].imageURL).to.equal(snapshot.imageURL);
  });

  it('should return 404 if no snapshots found', async () => {
    const response = await request(app)
      .get('/snapshots');

    expect(response.statusCode).to.equal(404);
  });

  it('should return an error if database fails to return data', async () => {
    /* eslint no-unused-vars: 0 */
    const snapshotStub = sinon.stub(Snapshot, 'find');
    snapshotStub.throws();

    const response = await request(app)
      .get('/snapshots');

    expect(response.statusCode).to.equal(500);
  });
});

