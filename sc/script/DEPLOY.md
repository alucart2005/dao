# Guía de Despliegue de Contratos

Esta guía explica cómo desplegar los contratos `MinimalForwarder` y `DAOVoting`. **Recomendamos empezar con Anvil (red local)** para desarrollo y pruebas antes de desplegar en Sepolia.

## 📋 Requisitos Previos

1. **Foundry instalado**: Asegúrate de tener Foundry instalado y configurado

   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Verificar instalación**:
   ```bash
   forge --version
   anvil --version
   ```

---

## 🚀 Despliegue en Red Local (Anvil) - RECOMENDADO PARA EMPEZAR

Anvil es la red local de Foundry, perfecta para desarrollo y pruebas sin costo. Es instantáneo y te permite probar tus contratos antes de desplegarlos en testnet.

### ¿Por qué usar Anvil primero?

- ✅ **Gratis**: No necesitas ETH real
- ✅ **Rápido**: Transacciones instantáneas
- ✅ **Seguro**: Errores no cuestan dinero
- ✅ **Fácil**: No necesitas configurar RPC externos
- ✅ **Ideal para desarrollo**: Prueba todo localmente primero

### Paso 1: Iniciar Anvil

Abre una terminal y ejecuta:

```bash
cd sc
anvil
```

**Salida esperada:**

```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...

Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...

Listening on 127.0.0.1:8545
```

Anvil está corriendo en `http://localhost:8545` con 10 cuentas pre-fundeadas con 10,000 ETH cada una.

### Paso 2: Configurar Variables de Entorno

En **otra terminal nueva** (deja Anvil corriendo), configura la clave privada:

```bash
cd sc
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

> ⚠️ **Nota**: Esta es la primera clave privada que muestra Anvil. Puedes usar cualquiera de las 10 que muestra. Estas claves son solo para desarrollo local y NUNCA deben usarse en producción.

### Paso 3: Ejecutar el Script de Despliegue

Con Anvil corriendo y la variable `PRIVATE_KEY` configurada, ejecuta:

```bash
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://localhost:8545 \
  --broadcast \
  -vvvv
```

**Explicación de flags:**

- `--rpc-url http://localhost:8545`: Conecta a Anvil
- `--broadcast`: Envía la transacción real (sin esto solo simula)
- `-vvvv`: Muestra logs detallados (útil para debugging)

### Paso 4: Verificar el Despliegue

El script mostrará algo como:

```
[⠊] Compiling...
[⠔] Compiling 40 files with Solc 0.8.30
[⠒] Solc 0.8.30 finished in 3.46s

Deploying MinimalForwarder...
MinimalForwarder deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deploying DAOVoting...
DAOVoting deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

=== Deployment Summary ===
MinimalForwarder: 0x5FbDB2315678afecb367f032d93F642f64180aa3
DAOVoting: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Network: Anvil (Local)
```

**¡Guarda estas direcciones!** Las necesitarás para interactuar con los contratos desde tu frontend.

### Paso 5: Probar los Contratos (Opcional)

Puedes probar los contratos usando `cast` (herramienta CLI de Foundry):

```bash
# Ver el balance total del DAO
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "totalBalance()" --rpc-url http://localhost:8545

# Obtener el balance de una cuenta
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "getUserBalance(address)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545
```

### 🔄 Reiniciar Anvil

Si necesitas empezar de nuevo:

1. Detén Anvil (Ctrl+C)
2. Inicia Anvil de nuevo: `anvil`
3. Los contratos anteriores ya no existirán (es una nueva blockchain)
4. Vuelve a desplegar usando el Paso 3

### 💡 Tips para Anvil

- **Persistencia**: Por defecto, Anvil reinicia desde cero cada vez. Si quieres persistencia, usa `anvil --state anvil-state.json`
- **Fork de mainnet**: Puedes hacer fork de mainnet con `anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY`
- **Múltiples instancias**: Puedes correr múltiples instancias en diferentes puertos: `anvil --port 8546`

---

## 🌐 Despliegue en Sepolia Testnet - GUÍA COMPLETA

Sepolia es una testnet oficial de Ethereum. Es ideal para probar tus contratos en un entorno más realista antes de desplegar en mainnet.

### ¿Qué es Sepolia?

- **Testnet oficial**: Mantenida por la comunidad de Ethereum
- **ETH de prueba**: Necesitas obtener ETH de prueba (gratis) de faucets
- **Explorador**: Puedes ver tus contratos en [Sepolia Etherscan](https://sepolia.etherscan.io)
- **Más lento**: Las transacciones toman ~12 segundos (vs instantáneo en Anvil)

### Paso 1: Obtener ETH de Prueba (Sepolia ETH)

**⚠️ IMPORTANTE**: Necesitas Sepolia ETH para pagar el gas. Es gratis, pero debes obtenerlo de un faucet.

#### Opción A: Sepolia Faucet (Recomendado)

1. Ve a [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
2. Conecta tu wallet (MetaMask, etc.)
3. Solicita Sepolia ETH
4. Espera unos minutos para recibir el ETH

#### Opción B: Alchemy Sepolia Faucet

1. Ve a [https://sepoliafaucet.com/](https://sepoliafaucet.com/) (Alchemy)
2. Ingresa tu dirección de wallet
3. Completa el CAPTCHA
4. Recibirás 0.5 Sepolia ETH

#### Opción C: Infura Sepolia Faucet

1. Ve a [https://www.infura.io/faucet/sepolia](https://www.infura.io/faucet/sepolia)
2. Conecta con tu cuenta de Infura
3. Solicita Sepolia ETH

**¿Cuánto ETH necesito?**

- Desplegar MinimalForwarder: ~0.001 ETH
- Desplegar DAOVoting: ~0.002 ETH
- **Total recomendado**: 0.01 Sepolia ETH (más que suficiente)

### Paso 2: Configurar RPC URL para Sepolia

Tienes varias opciones para conectarte a Sepolia:

#### Opción A: RPC Público (Gratis, puede ser lento)

```bash
export RPC_URL=https://rpc.sepolia.org
```

**Ventajas**: Gratis, no requiere registro  
**Desventajas**: Puede ser lento, rate limits

#### Opción B: Infura (Recomendado para desarrollo)

1. **Crear cuenta en Infura**:

   - Ve a [https://infura.io](https://infura.io)
   - Crea una cuenta gratuita
   - Verifica tu email

2. **Crear proyecto**:

   - En el dashboard, haz clic en "Create New Key"
   - Selecciona "Web3 API" como tipo
   - Elige "Sepolia" como red
   - Copia tu "API Key"

3. **Configurar RPC URL**:
   ```bash
   export RPC_URL=https://sepolia.infura.io/v3/TU_API_KEY_AQUI
   ```

**Límites gratuitos**: 100,000 requests/día (más que suficiente para desarrollo)

#### Opción C: Alchemy (Recomendado para producción)

1. **Crear cuenta en Alchemy**:

   - Ve a [https://www.alchemy.com](https://www.alchemy.com)
   - Crea una cuenta gratuita
   - Verifica tu email

2. **Crear app**:

   - En el dashboard, haz clic en "Create App"
   - Nombre: "DAO Voting Sepolia"
   - Red: "Ethereum"
   - Chain: "Sepolia"
   - Copia tu "API Key"

3. **Configurar RPC URL**:
   ```bash
   export RPC_URL=https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY_AQUI
   ```

**Límites gratuitos**: 300M compute units/mes (muy generoso)

#### Opción D: QuickNode (Alternativa)

1. Ve a [https://www.quicknode.com](https://www.quicknode.com)
2. Crea una cuenta y un endpoint para Sepolia
3. Copia tu RPC URL

### Paso 3: Configurar Variables de Entorno

**⚠️ SEGURIDAD**: NUNCA compartas tu clave privada. Considera usar un archivo `.env`.

#### Método 1: Variables de entorno directas

```bash
cd sc
export PRIVATE_KEY=tu_clave_privada_aqui
export RPC_URL=https://rpc.sepolia.org
```

#### Método 2: Archivo .env (RECOMENDADO)

1. **Crear archivo `.env` en `sc/`**:

   ```bash
   cd sc
   touch .env
   ```

2. **Editar `.env`** (usa tu editor favorito):

   ```env
   PRIVATE_KEY=tu_clave_privada_aqui
   RPC_URL=https://rpc.sepolia.org
   ETHERSCAN_API_KEY=tu_api_key_de_etherscan
   ```

3. **Verificar que `.env` esté en `.gitignore`**:

   ```bash
   grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
   ```

4. **Cargar variables**:
   ```bash
   source .env
   ```

> ⚠️ **IMPORTANTE**:
>
> - Asegúrate de tener fondos en Sepolia (obtén ETH de prueba de un faucet)
> - NUNCA compartas tu clave privada
> - El archivo `.env` ya está en `.gitignore` del proyecto

### Paso 4: Verificar Conexión y Balance

Antes de desplegar, verifica que todo esté configurado correctamente:

```bash
# Verificar que tienes Sepolia ETH
cast balance $(cast wallet address $PRIVATE_KEY) --rpc-url $RPC_URL

# Debería mostrar algo como: 100000000000000000 (0.1 ETH)
```

Si el balance es 0, vuelve al Paso 1 para obtener Sepolia ETH.

### Paso 5: Ejecutar el Script de Despliegue

Con todo configurado, ejecuta el script:

```bash
forge script script/DeployTestnet.s.sol:DeployTestnet \
  --rpc-url $RPC_URL \
  --broadcast \
  -vvvv
```

**Explicación de flags:**

- `--rpc-url $RPC_URL`: Usa la variable de entorno configurada
- `--broadcast`: Envía la transacción real a Sepolia
- `-vvvv`: Muestra logs detallados

**Tiempo estimado**: 1-2 minutos (espera a que se confirme la transacción)

### Paso 6: Verificar el Despliegue

El script mostrará las direcciones desplegadas:

```
=== Deployment Summary ===
MinimalForwarder: 0x1234...5678
DAOVoting: 0xabcd...efgh
Network: Testnet
RPC URL: https://rpc.sepolia.org
```

**Guarda estas direcciones** - las necesitarás para interactuar con los contratos.

### Paso 7: Verificar en Sepolia Etherscan

1. **Visita [Sepolia Etherscan](https://sepolia.etherscan.io)**
2. **Busca la dirección del contrato** (ej: `0x1234...5678`)
3. **Verifica que el contrato esté desplegado**:
   - Deberías ver "Contract" en la página
   - Puedes ver las transacciones de despliegue
   - Puedes ver el código bytecode

### Paso 8: Verificar Código en Etherscan (Opcional pero Recomendado)

Verificar el código permite a otros ver y auditar tu contrato en Etherscan.

#### Obtener API Key de Etherscan

1. **Crear cuenta en Etherscan**:

   - Ve a [https://etherscan.io/register](https://etherscan.io/register)
   - Crea una cuenta gratuita
   - Verifica tu email

2. **Obtener API Key**:

   - Ve a [https://etherscan.io/myapikey](https://etherscan.io/myapikey)
   - Haz clic en "Add" para crear una nueva API Key
   - Copia tu API Key

3. **Agregar a `.env`**:
   ```env
   ETHERSCAN_API_KEY=tu_api_key_aqui
   ```

#### Verificar Contratos Automáticamente

```bash
source .env
forge script script/DeployTestnet.s.sol:DeployTestnet \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

**Después de verificar**, podrás ver el código fuente en Etherscan y otros podrán interactuar con tu contrato más fácilmente.

### 🐛 Solución de Problemas Específicos de Sepolia

#### Error: "insufficient funds for gas"

**Causa**: No tienes suficiente Sepolia ETH  
**Solución**:

1. Verifica tu balance: `cast balance $(cast wallet address $PRIVATE_KEY) --rpc-url $RPC_URL`
2. Si es 0, obtén Sepolia ETH de un faucet (Paso 1)
3. Espera 5-10 minutos después de solicitar del faucet

#### Error: "nonce too low"

**Causa**: Hay transacciones pendientes o el nonce está desincronizado  
**Solución**:

```bash
# Verificar nonce actual
cast nonce $(cast wallet address $PRIVATE_KEY) --rpc-url $RPC_URL

# Si hay transacciones pendientes, espera a que se confirmen
# O usa un RPC diferente que esté sincronizado
```

#### Error: "execution reverted" o "contract creation code storage out of gas"

**Causa**: El contrato es muy grande o hay un error en el código  
**Solución**:

1. Revisa los logs con `-vvvv` para ver el error específico
2. Verifica que los contratos compilen: `forge build`
3. Prueba primero en Anvil para verificar que funciona

#### Error: "RPC URL not set" o "could not connect to RPC"

**Causa**: El RPC URL no está configurado o es incorrecto  
**Solución**:

```bash
# Verificar que RPC_URL esté configurado
echo $RPC_URL

# Probar conexión
cast block-number --rpc-url $RPC_URL

# Si falla, verifica que el RPC URL sea correcto
# Para Sepolia público: https://rpc.sepolia.org
```

#### Error: "rate limit exceeded" (con RPC público)

**Causa**: Has hecho demasiadas requests al RPC público  
**Solución**:

1. Espera unos minutos
2. O mejor: usa Infura o Alchemy (tienen límites más altos)

#### Error: "contract verification failed"

**Causa**: Problema al verificar el contrato en Etherscan  
**Solución**:

1. Verifica que `ETHERSCAN_API_KEY` esté configurado correctamente
2. Puedes verificar manualmente en Etherscan:
   - Ve a la página del contrato
   - Haz clic en "Contract" → "Verify and Publish"
   - Sigue las instrucciones

#### Transacción pendiente por mucho tiempo

**Causa**: La red está congestionada o el gas price es muy bajo  
**Solución**:

```bash
# Verificar estado de la transacción
cast tx <TX_HASH> --rpc-url $RPC_URL

# Si está pendiente, puedes aumentar el gas price
# Edita el script para incluir --gas-price o usa --legacy
```

### 📊 Comparación: Anvil vs Sepolia

| Característica | Anvil (Local)       | Sepolia (Testnet)                                 |
| -------------- | ------------------- | ------------------------------------------------- |
| Velocidad      | Instantáneo         | ~12 segundos                                      |
| Costo          | Gratis              | Sepolia ETH (gratis de faucets)                   |
| Persistencia   | Se reinicia         | Permanente                                        |
| Explorador     | No                  | [Sepolia Etherscan](https://sepolia.etherscan.io) |
| Ideal para     | Desarrollo, pruebas | Testing en entorno real                           |
| Configuración  | Mínima              | Requiere RPC y ETH                                |

### 💡 Mejores Prácticas para Sepolia

1. **Empieza en Anvil**: Siempre prueba primero en Anvil
2. **Guarda las direcciones**: Anota las direcciones de los contratos desplegados
3. **Verifica los contratos**: Facilita la interacción y auditoría
4. **Monitorea el gas**: Sepolia puede tener precios de gas variables
5. **Usa RPC confiable**: Infura o Alchemy son más estables que RPCs públicos

---

## 📝 Usando Archivo .env (Recomendado)

Para mayor seguridad y facilidad, usa un archivo `.env`:

### Crear archivo `.env` en `sc/`:

```env
# Clave privada (NUNCA compartas esto)
PRIVATE_KEY=tu_clave_privada_aqui

# RPC URL (para Sepolia)
RPC_URL=https://rpc.sepolia.org
# O con Infura: https://sepolia.infura.io/v3/TU_API_KEY
# O con Alchemy: https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY

# API Key de Etherscan (opcional, para verificación)
ETHERSCAN_API_KEY=tu_api_key_de_etherscan
```

### Cargar variables:

```bash
cd sc
source .env

# Verificar que se cargaron
echo $PRIVATE_KEY  # No debería estar vacío
echo $RPC_URL      # No debería estar vacío
```

### Ejecutar script:

```bash
forge script script/DeployTestnet.s.sol:DeployTestnet \
  --rpc-url $RPC_URL \
  --broadcast \
  -vvvv
```

---

## 📊 Orden de Despliegue

Los scripts desplegan los contratos en este orden:

1. **MinimalForwarder**: Forwarder para meta-transacciones (EIP-2771)
2. **DAOVoting**: Contrato principal del DAO (requiere la dirección del forwarder en el constructor)

El script maneja automáticamente las dependencias entre contratos.

---

## 🐛 Solución de Problemas General

### Error: "insufficient funds"

- **Causa**: No tienes suficiente ETH (Anvil) o Sepolia ETH (Sepolia)
- **Solución Anvil**: Usa una de las cuentas que muestra Anvil (tienen 10,000 ETH)
- **Solución Sepolia**: Obtén Sepolia ETH de un faucet

### Error: "nonce too low"

- **Causa**: Hay transacciones pendientes
- **Solución**: Espera a que se confirmen las transacciones anteriores

### Error: "execution reverted"

- **Causa**: El contrato falló al desplegarse
- **Solución**: Revisa los logs con `-vvvv` para más detalles. Prueba primero en Anvil.

### Error: "RPC URL not set"

- **Causa**: No configuraste `RPC_URL`
- **Solución**: Exporta la variable `RPC_URL` antes de ejecutar o usa un archivo `.env`

### Error: "contract not found" al interactuar

- **Causa**: La dirección del contrato es incorrecta o no está desplegado
- **Solución**: Verifica que usaste la dirección correcta del output del script

---

## 📚 Recursos Adicionales

### Documentación

- [Foundry Book - Scripts](https://book.getfoundry.sh/tutorials/solidity-scripting)
- [Foundry Book - Deploying](https://book.getfoundry.sh/forge/deploying)
- [Anvil Documentation](https://book.getfoundry.sh/anvil/)

### Faucets de Sepolia

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

### Exploradores

- [Sepolia Etherscan](https://sepolia.etherscan.io)
- [Sepolia Blockscout](https://sepolia.blockscout.com/)

### RPC Providers

- [Infura](https://infura.io) - RPC gratuito con límites generosos
- [Alchemy](https://www.alchemy.com) - RPC gratuito con excelente documentación
- [QuickNode](https://www.quicknode.com) - RPC premium con soporte

---

## ⚠️ Seguridad

- **NUNCA** compartas tu clave privada
- **NUNCA** subas archivos `.env` a Git (ya está en `.gitignore`)
- **NUNCA** uses claves privadas de producción en scripts de prueba
- Siempre verifica los contratos en Etherscan después del despliegue
- Revisa los contratos desplegados antes de usarlos en producción
- Usa cuentas separadas para desarrollo y producción

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs**: Usa `-vvvv` para ver detalles completos
2. **Verifica configuración**: Asegúrate de que todas las variables de entorno estén configuradas
3. **Prueba en Anvil primero**: Si funciona en Anvil pero no en Sepolia, es un problema de configuración
4. **Actualiza Foundry**: Ejecuta `foundryup` para obtener la última versión
5. **Revisa la documentación**: Consulta [Foundry Book](https://book.getfoundry.sh/)

---

## 🎯 Resumen Rápido

### Anvil (Local) - Para empezar

```bash
# Terminal 1
cd sc && anvil

# Terminal 2
cd sc
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast -vvvv
```

### Sepolia (Testnet) - Para testing real

```bash
# 1. Obtén Sepolia ETH de un faucet
# 2. Configura .env con PRIVATE_KEY y RPC_URL
# 3. Despliega
cd sc
source .env
forge script script/DeployTestnet.s.sol:DeployTestnet --rpc-url $RPC_URL --broadcast -vvvv
```

¡Buena suerte con tu despliegue! 🚀
