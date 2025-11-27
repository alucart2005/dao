"use client";

import { useState } from "react";

export function AppHelpModal() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="px-4 py-2 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
        style={{
          backgroundColor: "var(--color-stormy-teal)",
          color: "white",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-stormy-teal-600)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-stormy-teal)";
        }}
      >
        <span>❓</span>
        <span>Ayuda</span>
      </button>

      {/* Help Modal - Floating Window with Blur Background */}
      {showHelp && (
        <>
          {/* Backdrop with enhanced blur and transparency */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowHelp(false)}
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />

          {/* Modal Window */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="relative w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl border overflow-hidden flex flex-col"
              style={{
                backgroundColor: "var(--color-alabaster-grey-900)",
                borderColor: "var(--color-carbon-black-300)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{
                  backgroundColor: "var(--color-carbon-black)",
                  borderColor: "var(--color-carbon-black-300)",
                }}
              >
                <h3
                  className="text-xl font-bold flex items-center gap-2"
                  style={{ color: "var(--color-alabaster-grey)" }}
                >
                  <span>📖</span>
                  <span>Guía Completa del DAO Voting System</span>
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1.5 rounded transition-colors hover:bg-opacity-80"
                  style={{
                    backgroundColor: "var(--color-carbon-black-800)",
                    color: "var(--color-alabaster-grey)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-carbon-black-700)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-carbon-black-800)";
                  }}
                >
                  <span className="text-lg">×</span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div
                className="flex-1 overflow-y-auto p-6"
                style={{ backgroundColor: "var(--color-alabaster-grey-900)" }}
              >
                <div
                  className="space-y-6 text-sm"
                  style={{ color: "var(--color-carbon-black-700)" }}
                >
                  {/* Introducción */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🎯 ¿Qué es DAO Voting System?
                    </h4>
                    <p className="mb-3 leading-relaxed">
                      DAO Voting System es una aplicación descentralizada (dApp) que permite
                      la gobernanza democrática de una organización autónoma descentralizada
                      (DAO). El sistema permite a los miembros participar en la toma de
                      decisiones mediante un proceso de votación transparente, seguro y
                      completamente sin gas (gasless).
                    </p>
                    <p className="leading-relaxed">
                      La aplicación utiliza tecnología blockchain y contratos inteligentes
                      para garantizar la transparencia, inmutabilidad y descentralización
                      de todas las decisiones tomadas por la comunidad.
                    </p>
                  </section>

                  {/* Características Principales */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      ✨ Características Principales
                    </h4>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>
                        <strong>Votación Sin Gas:</strong> Todas las votaciones utilizan
                        meta-transacciones (EIP-2771), lo que significa que no necesitas
                        tener ETH en tu wallet para participar. El relayer paga las
                        comisiones por ti.
                      </li>
                      <li>
                        <strong>Gobernanza Transparente:</strong> Todas las propuestas y
                        votos son registrados en la blockchain, garantizando transparencia
                        total y auditabilidad.
                      </li>
                      <li>
                        <strong>Ejecución Automática:</strong> Las propuestas aprobadas
                        pueden ejecutarse automáticamente mediante el daemon, transfiriendo
                        fondos a los beneficiarios sin intervención manual.
                      </li>
                      <li>
                        <strong>Interfaz Intuitiva:</strong> Diseño moderno y fácil de usar
                        que permite a cualquier usuario participar en la gobernanza sin
                        conocimientos técnicos avanzados.
                      </li>
                      <li>
                        <strong>Seguridad Blockchain:</strong> Utiliza contratos
                        inteligentes auditados y estándares de la industria (OpenZeppelin)
                        para garantizar la seguridad de los fondos y las decisiones.
                      </li>
                    </ul>
                  </section>

                  {/* Cómo Funciona */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🔄 ¿Cómo Funciona el Sistema?
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-semibold mb-2">1. Financiación del DAO</h5>
                        <p className="leading-relaxed">
                          Los miembros pueden contribuir con fondos al DAO mediante el Panel
                          de Financiación. Estos fondos se almacenan de forma segura en el
                          contrato inteligente y pueden ser utilizados para ejecutar
                          propuestas aprobadas.
                        </p>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2">2. Creación de Propuestas</h5>
                        <p className="leading-relaxed">
                          Los miembros que posean al menos el 10% del balance total del DAO
                          pueden crear propuestas. Una propuesta especifica un beneficiario,
                          un monto a transferir y una fecha límite para la votación.
                        </p>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2">3. Proceso de Votación</h5>
                        <p className="leading-relaxed">
                          Durante el período de votación, todos los miembros pueden votar A
                          FAVOR, EN CONTRA o ABSTENERSE. Las votaciones son completamente
                          gratuitas gracias a las meta-transacciones. Puedes cambiar tu voto
                          en cualquier momento antes de la fecha límite.
                        </p>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2">4. Ejecución de Propuestas</h5>
                        <p className="leading-relaxed">
                          Una vez que la propuesta alcanza su fecha límite, se determina si
                          fue aprobada (más votos a favor que en contra). Las propuestas
                          aprobadas pueden ejecutarse automáticamente usando el Daemon de
                          Ejecución, que transfiere los fondos al beneficiario.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Secciones de la Aplicación */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      📋 Secciones de la Aplicación
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <h5
                          className="font-semibold mb-2"
                          style={{ color: "var(--color-seaweed)" }}
                        >
                          💰 Panel de Financiación
                        </h5>
                        <p className="mb-2 leading-relaxed">
                          Permite a los miembros contribuir con fondos al DAO. Puedes ver tu
                          balance personal, el balance total del DAO y realizar
                          contribuciones. Cada contribución aumenta tu poder de voto y te
                          permite crear propuestas si alcanzas el umbral del 10%.
                        </p>
                      </div>
                      <div>
                        <h5
                          className="font-semibold mb-2"
                          style={{ color: "var(--color-stormy-teal)" }}
                        >
                          📝 Crear Propuesta
                        </h5>
                        <p className="mb-2 leading-relaxed">
                          Formulario para crear nuevas propuestas de gasto. Debes especificar:
                          la dirección del beneficiario, el monto en ETH y la fecha límite
                          para la votación. Solo los miembros con al menos el 10% del balance
                          total pueden crear propuestas.
                        </p>
                      </div>
                      <div>
                        <h5
                          className="font-semibold mb-2"
                          style={{ color: "var(--color-stormy-teal)" }}
                        >
                          🗳️ Panel de Votaciones
                        </h5>
                        <p className="mb-2 leading-relaxed">
                          Centro de gobernanza donde puedes ver todas las propuestas, votar
                          sobre ellas y consultar resultados en tiempo real. Incluye:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>
                            <strong>Resumen de Votaciones:</strong> Vista consolidada con
                            estadísticas de todas las propuestas
                          </li>
                          <li>
                            <strong>Votación Directa:</strong> Botones para votar desde el
                            resumen sin necesidad de abrir detalles
                          </li>
                          <li>
                            <strong>Detalles Completos:</strong> Información detallada de cada
                            propuesta (beneficiario, monto, fechas, votos)
                          </li>
                          <li>
                            <strong>Daemon de Ejecución:</strong> Botón para ejecutar
                            automáticamente propuestas aprobadas
                          </li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Cómo Usar */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🚀 Guía de Uso Rápida
                    </h4>
                    <ol className="list-decimal list-inside space-y-3 ml-2">
                      <li>
                        <strong>Conecta tu Wallet:</strong> Haz clic en "Conectar Wallet" en la
                        esquina superior derecha y selecciona tu wallet (MetaMask, WalletConnect,
                        etc.). Asegúrate de estar conectado a la red correcta (Anvil Local para
                        desarrollo).
                      </li>
                      <li>
                        <strong>Financia el DAO:</strong> Ve al Panel de Financiación e ingresa
                        un monto en ETH. Haz clic en "Financiar DAO" y confirma la transacción
                        en tu wallet.
                      </li>
                      <li>
                        <strong>Participa en Votaciones:</strong> Ve al Panel de Votaciones,
                        revisa las propuestas activas y haz clic en A FAVOR, EN CONTRA o
                        ABSTENCIÓN. Firma la meta-transacción (sin costo de gas).
                      </li>
                      <li>
                        <strong>Crea Propuestas (Opcional):</strong> Si tienes al menos el 10%
                        del balance total, puedes crear propuestas usando el formulario "Crear
                        Propuesta".
                      </li>
                      <li>
                        <strong>Ejecuta Propuestas Aprobadas:</strong> Usa el botón "Ejecutar
                        Daemon" en el Panel de Votaciones para ejecutar automáticamente las
                        propuestas que han sido aprobadas y cumplieron su período de espera.
                      </li>
                    </ol>
                  </section>

                  {/* Tecnología */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      ⚙️ Tecnología Utilizada
                    </h4>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>
                        <strong>Blockchain:</strong> Ethereum (compatible con redes EVM)
                      </li>
                      <li>
                        <strong>Contratos Inteligentes:</strong> Solidity, OpenZeppelin Contracts
                      </li>
                      <li>
                        <strong>Meta-Transacciones:</strong> EIP-2771 y EIP-712 para votación sin
                        gas
                      </li>
                      <li>
                        <strong>Frontend:</strong> Next.js 16, React 19, TypeScript, Tailwind CSS
                      </li>
                      <li>
                        <strong>Web3:</strong> Wagmi v3, viem para interacción con blockchain
                      </li>
                      <li>
                        <strong>Desarrollo:</strong> Foundry para contratos, Anvil para red local
                      </li>
                    </ul>
                  </section>

                  {/* Requisitos */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      📱 Requisitos
                    </h4>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>Wallet compatible con EIP-712 (MetaMask, WalletConnect, etc.)</li>
                      <li>
                        Conexión a la red correcta (Anvil Local para desarrollo, Sepolia para
                        testnet)
                      </li>
                      <li>
                        No se requiere ETH en tu wallet para votar (las votaciones son gasless)
                      </li>
                      <li>Navegador moderno con soporte para Web3</li>
                    </ul>
                  </section>

                  {/* Consejos */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      💡 Consejos y Mejores Prácticas
                    </h4>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>
                        <strong>Revisa Antes de Votar:</strong> Siempre revisa los detalles
                        completos de una propuesta antes de emitir tu voto, especialmente el
                        monto y el beneficiario.
                      </li>
                      <li>
                        <strong>Participación Activa:</strong> Tu participación es crucial para
                        la gobernanza del DAO. Revisa las propuestas regularmente y vota según
                        tus convicciones.
                      </li>
                      <li>
                        <strong>Ejecución Proactiva:</strong> Ejecuta el daemon regularmente
                        para asegurar que las propuestas aprobadas se ejecuten oportunamente.
                      </li>
                      <li>
                        <strong>Cambio de Voto:</strong> Puedes cambiar tu voto en cualquier
                        momento mientras la propuesta esté activa. Tu voto anterior será
                        reemplazado automáticamente.
                      </li>
                      <li>
                        <strong>Seguridad:</strong> Nunca compartas tu clave privada. La
                        aplicación nunca te la solicitará. Siempre verifica las direcciones de
                        los contratos antes de interactuar.
                      </li>
                    </ul>
                  </section>

                  {/* Soporte */}
                  <section>
                    <h4
                      className="text-lg font-bold mb-3"
                      style={{ color: "var(--color-carbon-black)" }}
                    >
                      🆘 Soporte
                    </h4>
                    <p className="leading-relaxed">
                      Si tienes preguntas o encuentras algún problema, cada sección de la
                      aplicación tiene su propio botón de ayuda (❓) que proporciona información
                      detallada específica de esa funcionalidad.
                    </p>
                  </section>
                </div>
              </div>

              {/* Footer */}
              <div
                className="p-4 border-t flex justify-end"
                style={{
                  backgroundColor: "var(--color-alabaster-grey-800)",
                  borderColor: "var(--color-carbon-black-300)",
                }}
              >
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-6 py-2 rounded font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--color-carbon-black)",
                    color: "var(--color-alabaster-grey)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-carbon-black-800)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-carbon-black)";
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

