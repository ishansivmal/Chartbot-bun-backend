'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // This REMOVES the column from database
    await queryInterface.removeColumn('users', 'phone');
  },

  async down(queryInterface, Sequelize) {
    // This ADDS the column back if you rollback
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true  // or false, depending on your original column
    });
  }
};