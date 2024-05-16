function changeText() {
  document.getElementById('myText').innerHTML = decryptCaesarCipher(
    'bnte@tvsxsr.qi',
    4
  );
}
function decryptCaesarCipher(str, shift) {
  shift = ((shift % 26) + 26) % 26;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode >= 65 && charCode <= 90) {
      let letterValue = charCode - 65;
      letterValue = (letterValue - shift + 26) % 26;
      charCode = letterValue + 65;
    } else if (charCode >= 97 && charCode <= 122) {
      let letterValue = charCode - 97;
      letterValue = (letterValue - shift + 26) % 26;
      charCode = letterValue + 97;
    }
    result += String.fromCharCode(charCode);
  }
  return result;
}
