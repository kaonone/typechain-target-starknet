/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import webpack from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import DtsBundleWebpack from 'dts-bundle-webpack';

const config: webpack.Configuration = {
  mode: 'production',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  context: path.resolve(__dirname, '..', 'src'),
  entry: path.resolve(__dirname, '..', 'src', 'index.ts'),
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, '..', 'lib'),
    filename: `index.js`,
    // library: 'typechain-target-web3-rxjs',
    libraryTarget: 'commonjs',
  },
  resolve: {
    modules: ['node_modules', 'src'],
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  externals: ['typechain', 'path', 'ts-generator'],
  module: {
    rules: [
      {
        test: {
          exclude: /\.spec\.tsx?$/,
          include: /\.tsx?$/,
        },
        use: {
          loader: 'ts-loader',
          options: {
            logLevel: 'error',
          },
        },
      },
    ],
  },
  plugins: [
    new DtsBundleWebpack({
      name: 'typechain-target-web3-rxjs',
      main: path.resolve(__dirname, '..', 'lib', 'src', 'index.d.ts'),
      out: path.resolve(__dirname, '..', 'lib', 'index.d.ts'),
    }),
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: [
        path.resolve(__dirname, '..', 'lib', 'src'),
        path.resolve(__dirname, '..', 'lib', 'webpack'),
      ],
    }),
  ],
  stats: {
    // typescript would remove the interfaces but also remove the imports of typings
    // and because of this, warnings are shown https://github.com/TypeStrong/ts-loader/issues/653
    warningsFilter: /export .* was not found in/,
    assets: false,
    modules: false,
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
