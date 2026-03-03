module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Students", "email", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Students", "email");
  },
};