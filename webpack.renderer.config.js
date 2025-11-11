const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    config: './src/renderer/config/index.tsx',
    visualization: './src/renderer/visualization/index.tsx',
  },
  target: 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/config/index.html',
      filename: 'config.html',
      chunks: ['config'],
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/visualization/index.html',
      filename: 'visualization.html',
      chunks: ['visualization'],
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
  },
};

