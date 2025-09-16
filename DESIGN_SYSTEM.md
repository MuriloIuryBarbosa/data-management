# 🎨 Identidade Visual - Sistema de Gestão de Dados

## 📋 Visão Geral

Este documento descreve a identidade visual padronizada do Sistema de Gestão de Dados, incluindo paleta de cores, componentes e diretrizes de uso.

## 🎨 Paleta de Cores

### Cores Primárias
- **Azul Escuro**: `#1a365d` - Cor principal para elementos estruturais
- **Azul Médio**: `#2d3748` - Para destaques e elementos secundários
- **Azul Claro**: `#3182ce` - Para botões e links ativos

### Cores de Estado
- **Sucesso**: `#38a169` - Confirmações e estados positivos
- **Alerta**: `#d69e2e` - Avisos e atenção necessária
- **Erro**: `#e53e3e` - Estados de erro e problemas
- **Info**: `#3182ce` - Informações gerais

### Tons de Fundo
- **Branco**: `#ffffff` - Fundo principal
- **Cinza Claro**: `#f7fafc` - Fundo secundário
- **Cinza Médio**: `#edf2f7` - Fundo terciário
- **Cinza Escuro**: `#1a202c` - Texto principal

## 🧩 Componentes Disponíveis

### 1. Botões Padronizados

```html
<!-- Botão primário -->
<button class="btn-primary-custom">
    <i class="fas fa-save"></i>
    Salvar
</button>

<!-- Botão secundário -->
<button class="btn-secondary-custom">
    <i class="fas fa-times"></i>
    Cancelar
</button>
```

### 2. Cards Padronizados

```html
<div class="card-custom">
    <div class="card-header">
        <h5><i class="fas fa-chart-line"></i> Título do Card</h5>
    </div>
    <div class="card-body">
        <p>Conteúdo do card aqui.</p>
    </div>
</div>
```

### 3. Formulários Padronizados

```html
<div class="form-group-custom">
    <label class="form-label-custom" for="exampleInput">
        <i class="fas fa-user"></i>
        Nome do Campo
    </label>
    <input type="text" class="form-control-custom" id="exampleInput" placeholder="Digite aqui...">
</div>
```

### 4. Tabelas Padronizadas

```html
<div class="table-responsive">
    <table class="table-custom">
        <thead>
            <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Status</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>João Silva</td>
                <td>joao@email.com</td>
                <td><span class="status-indicator status-active">Ativo</span></td>
                <td>
                    <button class="btn-primary-custom btn-sm">Editar</button>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

### 5. Badges e Alertas

```html
<!-- Badges -->
<span class="badge-custom badge-success-custom">
    <i class="fas fa-check"></i>
    Sucesso
</span>

<!-- Alertas -->
<div class="alert-custom alert-success-custom">
    <i class="fas fa-check-circle"></i>
    <div>
        <strong>Operação realizada!</strong>
        Os dados foram salvos com sucesso.
    </div>
</div>
```

### 6. Cards do Dashboard

```html
<a href="/cadastros/familias" class="dashboard-card">
    <div class="icon primary">
        <i class="fas fa-users"></i>
    </div>
    <h3>1,234</h3>
    <p>Famílias Cadastradas</p>
</a>
```

## 📱 Responsividade

Todos os componentes são responsivos e se adaptam automaticamente a diferentes tamanhos de tela:

- **Desktop**: Layout completo com sidebar expandida
- **Tablet**: Sidebar recolhível, elementos ajustados
- **Mobile**: Sidebar em overlay, componentes empilhados

## 🎯 Diretrizes de Uso

### 1. Hierarquia Visual
- Use cores primárias para elementos principais
- Cores de estado apenas para feedback contextual
- Mantenha contraste adequado para acessibilidade

### 2. Espaçamento Consistente
- Use as classes de espaçamento: `.spacing-xs`, `.spacing-sm`, etc.
- Mantenha proporções consistentes entre elementos

### 3. Ícones
- Use FontAwesome 6 para todos os ícones
- Mantenha tamanho consistente (16px-24px)
- Use cores apropriadas ao contexto

### 4. Tipografia
- **Títulos**: `font-weight: 600-700`
- **Corpo**: `font-weight: 400-500`
- **Legendas**: `font-weight: 400`, `color: var(--text-secondary)`

## 🚀 Implementação

### Arquivos Relacionados
- `src/views/layouts/base.ejs` - Layout principal com estilos base
- `public/css/components.css` - Componentes reutilizáveis
- `src/views/partials/` - Componentes parciais (se aplicável)

### Como Usar
1. Inclua o CSS de componentes no seu layout
2. Use as classes padronizadas nos seus templates
3. Mantenha consistência com as diretrizes estabelecidas

## 🔧 Personalização

Para personalizar cores ou componentes:

1. Modifique as variáveis CSS em `:root`
2. Atualize os componentes em `components.css`
3. Teste em diferentes dispositivos
4. Documente mudanças realizadas

## 📋 Checklist de Qualidade

- [ ] Contraste adequado (WCAG AA)
- [ ] Responsividade testada
- [ ] Componentes consistentes
- [ ] Performance otimizada
- [ ] Documentação atualizada

---

**Última atualização**: 16 de setembro de 2025
**Versão**: 1.0.0