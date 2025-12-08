const handbookService = require('../services/handbookService');

let createNewHandbook = async (req, res) => {
  try {
    let response = await handbookService.createNewHandbook(req.body);
    return res.status(200).json(response);
  } catch (e) {
    console.log('Error From Server - createNewHandbook API !', e);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error From Server - createNewHandbook API !',
    });
  }
};

let getAllHandbook = async (req, res) => {
  try {
    let response = await handbookService.getAllHandbook();
    return res.status(200).json(response);
  } catch (e) {
    console.log('Error From Server - getAllHandbook API !', e);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error From Server - getAllHandbook API !',
    });
  }
};

let getDetailsHandbookById = async (req, res) => {
  try {
    let response = await handbookService.getDetailsHandbookById(
      req.query.id,
    );
    return res.status(200).json(response);
  } catch (e) {
    console.log('Error From Server - getAllHandbook API !', e);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error From Server - getAllHandbook API !',
    });
  }
};

module.exports = {
  createNewHandbook,
  getAllHandbook,
  getDetailsHandbookById,
};
