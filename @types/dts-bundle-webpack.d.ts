declare module 'dts-bundle-webpack' {
  import webpack from 'webpack';

  interface Options {
    name: string;
    main: string;
    out?: string;
  }

  class DtsBundleWebpack extends webpack.Plugin {
    constructor(options: Options);
  }

  // eslint-disable-next-line import/no-default-export
  export default DtsBundleWebpack;
}
