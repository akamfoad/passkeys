import { UAParser } from "ua-parser-js";

export const generatePasskeyName = (ua: string) => {
  const parser = new UAParser(ua);
  console.log(parser.getResult());
  let string = `${parser.getBrowser().name} on `;

  let { model } = parser.getDevice();
  if (model) string += model;
  else if (parser.getOS().name) {
    string += parser.getOS().name;
    if (parser.getOS().version) {
      string += ` ${parser.getOS().version}`;
    }
  }

  return string;
};
