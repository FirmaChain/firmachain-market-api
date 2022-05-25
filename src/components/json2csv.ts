export function jsonToCSV(json_data) {
  const json_array = [...json_data];
  const titles = Object.keys(json_array[0]);

  let csv_string = '';

  titles.forEach((title, index) => {
    csv_string += (index !== titles.length - 1 ? `${title},` : `${title}\r\n`);
  });
  // console.log(titles);

  json_array.forEach((content, index) => {
    let row = '';
    for (let title in content) {
      if (title === 'amount') {
        // content[title] = Number(content[title]) / Math.pow(10, 6);
        // console.log(content[title])
      }
      row += (row === '' ? `${content[title]}` : `,${Number(content[title]) / Math.pow(10, 6)}`);
      // console.log(row);
    }
    csv_string += (index !== json_array.length - 1 ? `${row}\r\n` : `${row}`);
  });

  console.log(csv_string);
  return csv_string;
}