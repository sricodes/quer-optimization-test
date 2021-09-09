module.exports = {
  apps: [
    {
      name: 'portfolio-schedulers',
      script: './index.js',
      watch: false,
      env: {
        NODE_ENV: 'default'
      },
      env_production: {
        NODE_ENV: 'production',
      },
      env_stageAws: {
        NODE_ENV: 'stageAws',
      }
    }
  ]
};
