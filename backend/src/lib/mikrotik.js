async function login(conn, username, password) {
  // 1. Intentamos el login directo v7 / Plaintext
  conn.write(['/login', `=name=${username}`, `=password=${password}`]);
  let result = await conn.read();

  // Si devuelve !done directo, la autenticación fue exitosa (RouterOS v7)
  if (result[0] === '!done') {
    return;
  }

  // 2. Si el router responde con un challenge (=ret=), es un RouterOS v6 antiguo
  let challenge = '';
  for (const w of result) {
    if (w.startsWith('=ret=')) challenge = w.slice(5);
  }

  if (challenge) {
    // Proceso Legacy MD5 para RouterOS v6
    const hash = crypto
      .createHash('md5')
      .update(Buffer.concat([
        Buffer.from([0]),
        Buffer.from(password, 'utf8'),
        Buffer.from(challenge, 'hex')
      ]))
      .digest('hex');

    conn.write(['/login', `=name=${username}`, `=response=${hash}`]);
    result = await conn.read();

    if (result[0] === '!done') {
      return;
    }
  }

  // Si fallan ambos métodos, extraemos el mensaje de error del !trap
  const msg = result.find((w) => w.startsWith('=message=')) || '';
  throw new Error('Login fallido: ' + (msg ? msg.slice(9) : 'Credenciales o permisos incorrectos'));
}
