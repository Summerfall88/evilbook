import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";


interface TermsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TermsDialog = ({ open, onOpenChange }: TermsDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-display font-bold text-lg">
                        Пользовательское соглашение и политика конфиденциальности
                    </DialogTitle>
                </DialogHeader>

                <div className="h-[60vh] overflow-y-auto mt-2 pr-4 border rounded-md p-4 bg-background">
                    <div className="space-y-6 text-sm text-foreground leading-relaxed">

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">1. ОБЩИЕ ПОЛОЖЕНИЯ</h2>
                            <p>1.1. Настоящий документ регулирует порядок использования сайта (далее - «Сайт»), а также обработку персональных данных пользователей.</p>
                            <p>1.2. Регистрируясь на Сайте, пользователь подтверждает согласие с настоящими условиями.</p>
                            <p>1.3. Сайт осуществляет деятельность в соответствии с законодательством Республики Казахстан, включая Закон РК «О персональных данных и их защите».</p>
                        </section>

                        <div className="pt-4 border-t border-border">
                            <h2 className="font-display font-bold text-lg mb-4 text-primary">ЧАСТЬ I. ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ</h2>
                        </div>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">2. РЕГИСТРАЦИЯ НА САЙТЕ</h2>
                            <p>2.1. Для публикации комментариев пользователь должен пройти регистрацию.</p>
                            <p>2.2. Пользователь обязуется предоставлять достоверную информацию.</p>
                            <p>2.3. Пользователь несёт ответственность за сохранность своих данных для входа.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">3. ПУБЛИКАЦИЯ КОММЕНТАРИЕВ</h2>
                            <p>3.1. Пользователь имеет право публиковать комментарии к рецензиям.</p>
                            <p>3.2. Запрещается размещение: оскорблений, угроз, экстремистских материалов, незаконного контента, спама и рекламы, материалов нарушающих авторские права.</p>
                            <p>3.3. Администрация вправе: удалять комментарии без объяснения причин, блокировать пользователей, ограничивать доступ к аккаунту.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">4. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ</h2>
                            <p>4.1. Все рецензии и материалы сайта являются интеллектуальной собственностью владельца сайта либо размещаются на законных основаниях.</p>
                            <p>4.2. Пользователь, публикуя комментарий, предоставляет сайту право на его отображение и хранение.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">5. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ</h2>
                            <p>5.1. Администрация не несёт ответственности за содержание комментариев пользователей.</p>
                            <p>5.2. Сайт может содержать рекламу и ссылки на сторонние ресурсы. Администрация не несёт ответственности за их содержание.</p>
                        </section>

                        <div className="pt-4 border-t border-border">
                            <h2 className="font-display font-bold text-lg mb-4 text-primary">ЧАСТЬ II. ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</h2>
                        </div>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">6. КАКИЕ ДАННЫЕ СОБИРАЮТСЯ</h2>
                            <p>Сайт может собирать: имя или никнейм, адрес электронной почты, IP-адрес, данные браузера, файлы cookie, информацию о действиях на сайте.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">7. ЦЕЛИ ОБРАБОТКИ ДАННЫХ</h2>
                            <p>Персональные данные используются для: регистрации и авторизации пользователя, публикации комментариев, обратной связи, отправки добровольной email-рассылки, показа рекламы, аналитики посещаемости.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">8. РАССЫЛКА</h2>
                            <p>8.1. Email-рассылка осуществляется только при добровольном согласии пользователя.</p>
                            <p>8.2. Пользователь может отказаться от рассылки в любой момент в личном кабинете.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">9. РЕКЛАМА И СТОРОННИЕ СЕРВИСЫ</h2>
                            <p>9.1. На сайте может размещаться реклама.</p>
                            <p>9.2. Для аналитики и рекламы могут использоваться сторонние сервисы.</p>
                            <p>9.3. Эти сервисы могут использовать cookie и иные технологии сбора данных в соответствии со своими политиками конфиденциальности.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">10. ХРАНЕНИЕ И ЗАЩИТА ДАННЫХ</h2>
                            <p>10.1. Данные хранятся на защищённых серверах.</p>
                            <p>10.2. Принимаются технические и организационные меры для защиты персональных данных.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">11. УДАЛЕНИЕ АККАУНТА</h2>
                            <p>11.1. Пользователь вправе запросить удаление своего аккаунта.</p>
                            <p>11.2. После удаления аккаунта персональные данные удаляются, за исключением случаев, предусмотренных законодательством Республики Казахстан.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">12. COOKIES</h2>
                            <p>12.1. Сайт использует файлы cookie для корректной работы, аналитики и показа рекламы.</p>
                            <p>12.2. Пользователь может отключить cookie в настройках браузера.</p>
                        </section>

                        <section>
                            <h2 className="font-display font-bold text-base mb-2">13. ИЗМЕНЕНИЕ УСЛОВИЙ</h2>
                            <p>13.1. Администрация вправе изменять настоящий документ.</p>
                            <p>13.2. Новая редакция вступает в силу с момента публикации на сайте.</p>
                        </section>

                        <section className="bg-muted p-4 rounded-lg">
                            <h2 className="font-display font-bold text-base mb-2">14. КОНТАКТНАЯ ИНФОРМАЦИЯ</h2>
                            <p><strong>Email:</strong> Christinaevilbook@gmail.com</p>
                            <p><strong>Владелец сайта:</strong> Клокова Кристина Владимировна</p>
                        </section>

                        <p className="text-muted-foreground text-xs border-t border-border pt-4">
                            Последнее обновление: 15.04.2026 г.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
};

export default TermsDialog;
