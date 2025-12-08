const db = require("../models/index");

let createNewHandbook = (inputData) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !inputData.name ||
        !inputData.imageBase64 ||
        !inputData.descriptionHTML ||
        !inputData.descriptionMarkdown
      ) {
        resolve({
          errCode: 1,
          errMessage: "Missing Required Parameters - createNewHandbook !",
        });
      } else {
        await db.HandBook.create({
          name: inputData.name,
          image: inputData.imageBase64,
          descriptionHTML: inputData.descriptionHTML,
          descriptionMarkdown: inputData.descriptionMarkdown,
        });

        resolve({
          errCode: 0,
          errMessage: "Successfully !",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getAllHandbook = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await db.HandBook.findAll();
      if (data && data.length > 0) {
        data.map((item) => {
          item.image = Buffer.from(item.image, "base64").toString("binary");
          return item;
        });
      }
      resolve({
        errCode: 0,
        errMessage: "Successfully !",
        data,
      });
    } catch (e) {
      reject(e);
    }
  });
};

let getDetailsHandbookById = (handbookId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!handbookId) {
        resolve({
          errCode: 1,
          errMessage:
            "Missing Required Parameters - getDetailsHandbookById API",
        });
      } else {
        let data = await db.HandBook.findOne({
          where: { id: handbookId },
        });
        if (data) {
          data.image = Buffer.from(data.image, "base64").toString("binary");
        }
        resolve({
          errCode: 0,
          errMessage: "Successfully !",
          data,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createNewHandbook,
  getAllHandbook,
  getDetailsHandbookById,
};
