import email from "infra/email.js";
import orchestrator from "tests/orchestrator";

describe("infra/email.js", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.deleteAllEmails();
  });
  test("send()", async () => {
    await email.send({
      from: '"Clone TabNews" <contato@email.com.br>',
      to: "contato@curso.dev",
      subject: "Teste de assunto",
      text: "Teste de corpo",
    });
    const lastPayload = {
      from: '"Clone TabNews" <contato@email.com.br>',
      to: "contato@curso.dev",
      subject: "Último e-mail enviado",
      text: "Corpo do último e-mail",
    };
    await email.send(lastPayload);
    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@email.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@curso.dev>");
    expect(lastEmail.subject).toBe(lastPayload.subject);
    expect(lastEmail.text.trim()).toBe("Corpo do último e-mail".trim());
  });
});
