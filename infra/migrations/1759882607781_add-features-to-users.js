/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn("users", {
    features: {
      type: "varchar[]",
      notNul: true,
      default: "{}",
    },
  });
};

exports.down = false;
