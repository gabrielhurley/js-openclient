module.exports = {
  current: '2.0',
  '2.0': require('./v2.0/client'),
  '3.0': require('./v3.0/client')
};