"""Hook PreToolUse: bloqueia alterações em arquivos sensíveis (segredos, chaves, certificados)."""
import fnmatch
import json
import os
import sys

BLOQUEADOS = [".env", ".env.*", "*.pem", "*.key", "*.pfx", "*.p12", "id_rsa*", "id_ed25519*"]
PERMITIDOS = [".env.example", ".env.sample", ".env.template"]


def main():
    dados = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    entrada = dados.get("tool_input") or {}
    caminho = entrada.get("file_path") or entrada.get("notebook_path") or ""
    nome = os.path.basename(caminho).lower()

    if nome in PERMITIDOS or not any(fnmatch.fnmatch(nome, p) for p in BLOQUEADOS):
        return

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": f"'{nome}' é um arquivo sensível protegido pelo hook proteger_arquivos. Peça ao usuário para editá-lo manualmente.",
        }
    }))


if __name__ == "__main__":
    main()
