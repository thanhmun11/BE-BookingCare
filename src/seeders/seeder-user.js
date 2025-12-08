const bcrypt = require("bcryptjs");
module.exports = {
  up: (queryInterface, Sequelize) => {
    const hashPassword = bcrypt.hashSync("123456", bcrypt.genSaltSync(10));
    return queryInterface.bulkInsert("Users", [
      {
        firstName: "John",
        lastName: "Doe",
        email: "admin@gmail.com",
        password: hashPassword, // plain text --> hash
        gender: 1,
        phoneNumber: "1234567890",
        address: "123 Main St, Anytown, USA",
        roleId: "R1",
        positionId: "P1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Users", null, {});
  },
};
