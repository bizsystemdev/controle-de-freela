migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Obtém o SITE_URL do ambiente ou fallback
    let siteUrl = $os.getenv('SITE_URL') || ''
    if (!siteUrl) {
      siteUrl = '{APP_URL}'
    }
    // Remove barra final se houver
    if (siteUrl.endsWith('/')) {
      siteUrl = siteUrl.slice(0, -1)
    }

    const resetUrl = siteUrl + '/admin/redefinir-senha?token={TOKEN}'

    users.resetPasswordTemplate = {
      subject: 'Redefinir sua senha — Freela Check',
      body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #ffffff; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.025em;">Freela Check</h2>
    <p style="font-size: 13px; color: #64748b; margin: 4px 0 0;">Controle de Presença &amp; Gestão</p>
  </div>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px 24px; margin-bottom: 24px;">
    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Redefinição de senha solicitada</h3>
    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px;">
      Recebemos uma solicitação para redefinir a senha da sua conta de gestor/administrador. Clique no botão abaixo para cadastrar uma nova senha:
    </p>
    
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" target="_blank" rel="noopener" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
        Redefinir Minha Senha
      </a>
    </div>
    
    <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 20px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:<br/>
      <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
    </p>
  </div>
  
  <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin: 0;">
    Se você não solicitou a redefinição de senha, nenhuma ação é necessária. O link expirará em 30 minutos por segurança.
  </p>
</div>`,
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.resetPasswordTemplate = {
      subject: 'Reset your {APP_NAME} password',
      body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
    }
    app.save(users)
  },
)
