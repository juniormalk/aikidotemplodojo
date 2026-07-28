# old config DNS
A (Host)
Nome do host
Valor
TTL
aikidotemplodojo.com.br	185.230.63.171	1 hora	

aikidotemplodojo.com.br	185.230.63.186	1 hora	

aikidotemplodojo.com.br	185.230.63.107	1 hora	

Registro CNAME (Aliases)
Nome do host
Valor
TTL
www.aikidotemplodojo.com.br
cdn1.wixdns.net	1 hora	

TXT (Texto)
SRV
MX (Mail Exchange)
Você pode 
 que comprou em outro lugar ou 
 conosco.
NS (Servidores de Nome)
Registros NS não podem ser editados.
Nome do host
Valor
TTL
aikidotemplodojo.com.br	ns15.wixdns.net	1 dia	
aikidotemplodojo.com.br	ns14.wixdns.net	1 dia	


# Deploy - aikidotemplodojo.com.br (Ubuntu + Apache)

Este projeto e um site estatico (HTML/CSS/JS + pasta de midia).

## Estrutura do projeto

- index.html
- styles.css
- script.js
- media/

## Git: ignorar pasta de referencia de imagens

Se a pasta `_imgRef/` (ou `_ImfRef/`) ja entrou no Git antes do `.gitignore`, remova do indice com os comandos abaixo.

### Linux/macOS/Git Bash

```bash
git rm -r --cached _imgRef _ImfRef 2>/dev/null || true
git add .gitignore
git commit -m "chore: ignore image reference folder"
```

### Windows PowerShell (Git)

```powershell
git rm -r --cached _imgRef _ImfRef
git add .gitignore
git commit -m "chore: ignore image reference folder"
```

Se aparecer erro para uma das pastas (porque nao existe), pode ignorar e seguir.

## Objetivo do deploy

Publicar o site no dominio:

- aikidotemplodojo.com.br

Enviando os arquivos para:

- 177.153.59.199:/var/www/vhosts/aikidotemplodojo


---

## 1) Pre-requisitos no servidor Ubuntu

No servidor, instale Apache e abra portas HTTP/HTTPS:

```bash
sudo apt update
sudo apt install -y apache2
sudo ufw allow "Apache Full"
```

Crie o diretorio do site (caso ainda nao exista):

```bash
sudo mkdir -p /var/www/vhosts/aikidotemplodojo
sudo chown -R $USER:$USER /var/www/vhosts/aikidotemplodojo
sudo chmod -R 755 /var/www/vhosts/aikidotemplodojo
```

---

## 2) DNS do dominio

No provedor DNS do dominio `aikidotemplodojo.com.br`, configure:

- Registro A para `@` apontando para `177.153.59.199`
- Registro A para `www` apontando para `177.153.59.199` (opcional, recomendado)

Aguarde propagacao antes de validar HTTPS.

---

## 3) Enviar arquivos via scp (opcao simples)

Execute os comandos na maquina local, dentro da pasta do projeto.

### Linux/macOS (ou Git Bash)

```bash
scp -r index.html styles.css script.js media usuario@177.153.59.199:/var/www/vhosts/aikidotemplodojo/
```

### Windows PowerShell (OpenSSH)

```powershell
scp -r .\index.html, .\styles.css, .\script.js, .\media root@177.153.59.199:/var/www/vhosts/aikidotemplodojo/
```

Se preferir enviar tudo da pasta atual:

```bash
scp -r ./* root@177.153.59.199:/var/www/vhosts/aikidotemplodojo/
```

---

## 3.1) Enviar arquivos via rsync (recomendado)

`rsync` envia apenas diferencas, acelera atualizacoes e pode remover arquivos antigos no destino.

### Linux/macOS (ou Git Bash/WSL)

Primeiro deploy (sem apagar nada no servidor):

```bash
rsync -avz --progress \
    --exclude ".git/" \
    --exclude ".vscode/" \
    --exclude "_imgRef/" \
    ./ usuario@177.153.59.199:/var/www/vhosts/aikidotemplodojo/
```

Deploy de sincronizacao completa (remove arquivos que nao existem mais localmente):

```bash
rsync -avz --delete --progress \
    --exclude ".git/" \
    --exclude ".vscode/" \
    --exclude "_imgRef/" \
    ./ usuario@177.153.59.199:/var/www/vhosts/aikidotemplodojo/
```

### Windows PowerShell

Opcao A: usar WSL/Git Bash com os comandos acima.

Opcao B: manter `scp` no PowerShell nativo (se `rsync` nao estiver disponivel).

---

## 4) Configurar VirtualHost no Apache

No servidor, crie o arquivo:

```bash
sudo nano /etc/apache2/sites-available/aikidotemplodojo.conf
```

Conteudo sugerido:

```apache
<VirtualHost *:80>
    ServerName aikidotemplodojo.com.br
    ServerAlias www.aikidotemplodojo.com.br

    DocumentRoot /var/www/vhosts/aikidotemplodojo

    <Directory /var/www/vhosts/aikidotemplodojo>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/aikidotemplodojo_error.log
    CustomLog ${APACHE_LOG_DIR}/aikidotemplodojo_access.log combined
</VirtualHost>
```

Ative o site e recarregue o Apache:

```bash
sudo a2ensite aikidotemplodojo.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

## 5) SSL com Let's Encrypt (recomendado)

No servidor:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d aikidotemplodojo.com.br -d www.aikidotemplodojo.com.br
```

Teste renovacao automatica:

```bash
sudo certbot renew --dry-run
```

---

## 6) Permissoes finais

Depois do upload, garanta leitura pelo Apache:

```bash
sudo chown -R www-data:www-data /var/www/vhosts/aikidotemplodojo
sudo find /var/www/vhosts/aikidotemplodojo -type d -exec chmod 755 {} \;
sudo find /var/www/vhosts/aikidotemplodojo -type f -exec chmod 644 {} \;
```

---

## 7) Checklist de validacao

- Site abre em <http://aikidotemplodojo.com.br>
- Site abre em <https://aikidotemplodojo.com.br>
- CSS carregando corretamente
- Imagens da pasta `media/` aparecendo
- Links internos do menu funcionando
- Link do WhatsApp funcionando
- Video abrindo no YouTube

---

## 8) Deploy de atualizacao (rotina)

Fluxo recomendado (incremental com rsync):

```bash
rsync -avz --delete --progress \
    --exclude ".git/" \
    --exclude ".vscode/" \
    --exclude "_imgRef/" \
    ./ usuario@177.153.59.199:/var/www/vhosts/aikidotemplodojo/
```

Alternativa com scp:

```bash
scp -r index.html styles.css script.js media usuario@177.153.59.199:/var/www/vhosts/aikidotemplodojo/
```

Opcional: limpar cache do navegador com hard refresh (Ctrl+F5) para validar alteracoes.

---

## Troubleshooting rapido

No servidor na pasta do site:
chown -R www-data:www-data ./


### Apache nao sobe

```bash
sudo apache2ctl configtest
sudo journalctl -u apache2 --no-pager -n 100
```

### Permissao negada no scp

- Verifique usuario SSH.
- Verifique se a pasta existe e tem permissao de escrita.
- Se necessario, envie para home do usuario e mova com sudo.

### Dominio nao abre

- Confirme DNS apontando para `177.153.59.199`.
- Teste com `ping` e `dig`.
- Confira firewall e porta 80/443.


