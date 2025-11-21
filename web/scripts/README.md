# Scripts de Utilidad

## sync-contracts.js

Script para sincronizar automáticamente las direcciones de los contratos inteligentes desplegados.

### Funcionalidades

- ✅ Lee direcciones desde archivos de broadcast de Foundry
- ✅ Verifica contratos en el blockchain como respaldo
- ✅ Compara con direcciones actuales en `.env.local`
- ✅ Actualiza `.env.local` automáticamente si hay diferencias
- ✅ Incluye logging detallado y manejo de errores
- ✅ Opción para forzar actualización manual

### Uso

#### Automático

El script se ejecuta automáticamente antes de `npm run dev` y `npm run build` gracias al hook `predev` y `prebuild` en `package.json`.

#### Manual

```bash
# Sincronización normal
npm run sync-contracts

# Forzar actualización (incluso si no hay cambios)
npm run sync-contracts:force

# Modo verbose (muestra logs detallados)
npm run sync-contracts:verbose

# O directamente con node
node scripts/sync-contracts.js
node scripts/sync-contracts.js --force
node scripts/sync-contracts.js --verbose
```

### Opciones

- `--force`: Fuerza la actualización incluso si no hay cambios
- `--verbose` o `-v`: Muestra logs detallados para depuración

### API Endpoint

También puedes sincronizar mediante la API:

```bash
# GET request
curl http://localhost:3000/api/sync-contracts
curl http://localhost:3000/api/sync-contracts?force=true
curl http://localhost:3000/api/sync-contracts?verbose=true

# POST request
curl -X POST http://localhost:3000/api/sync-contracts \
  -H "Content-Type: application/json" \
  -d '{"force": true, "verbose": true}'
```

### Cómo Funciona

1. **Lee desde Broadcast Files**: Busca en `sc/broadcast/DeployLocal.s.sol/{CHAIN_ID}/run-*.json` las direcciones más recientes
2. **Verifica en Blockchain**: Si no encuentra en broadcast, intenta verificar contratos en el blockchain
3. **Compara**: Compara las direcciones encontradas con las actuales en `.env.local`
4. **Actualiza**: Si hay diferencias (o si se usa `--force`), actualiza `.env.local`

### Requisitos

- Node.js instalado
- `viem` instalado (ya está en las dependencias)
- Anvil corriendo (para verificación en blockchain)
- Contratos desplegados con `forge script --broadcast`

### Ejemplo de Salida

```
🚀 Iniciando sincronización de direcciones de contratos...

Direcciones actuales en .env.local:
  DAO_VOTING: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  MINIMAL_FORWARDER: 0x5FbDB2315678afecb367f032d93F642f64180aa3

Leyendo archivo de broadcast: run-latest.json
Direcciones encontradas en broadcast:
  DAO_VOTING: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  MINIMAL_FORWARDER: 0x5FbDB2315678afecb367f032d93F642f64180aa3

✅ Las direcciones ya están actualizadas. No se requieren cambios.
```

### Solución de Problemas

#### Error: "No se pudieron encontrar las direcciones"

**Causa**: Los contratos no están desplegados o los archivos de broadcast no existen.

**Solución**:

1. Asegúrate de que Anvil esté corriendo
2. Despliega los contratos: `cd sc && forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast`
3. Verifica que exista el directorio `sc/broadcast/DeployLocal.s.sol/31337/`

#### Error: "Contract code is empty"

**Causa**: El contrato no existe en esa dirección (Anvil se reinició).

**Solución**: Vuelve a desplegar los contratos.

#### El script no se ejecuta automáticamente

**Causa**: Los hooks `predev` y `prebuild` no están configurados.

**Solución**: Verifica que `package.json` tenga los scripts `predev` y `prebuild`.

### Notas

- El script solo actualiza `.env.local`, no sobrescribe otras variables
- Las direcciones se validan antes de actualizar
- El script verifica que los contratos existan en el blockchain antes de actualizar
- En modo producción, considera deshabilitar la sincronización automática
