
// Section2
<div
          style={{
            margin: "16px 0",
            border: "1px solid #C6C6C6",
            borderRadius: "16px",
            padding: "16px",
            backgroundColor: "#FBFBFB",
          }}
        >
          <div
            className="d-flex jcb"
            style={{
              backgroundColor: "#FBFBFB",
              width: "100%",
              border: "1px solid #C6C6C6",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            {/* Left side - Form */}
            <div style={{ width: "60%" }}>
              <div className="mb-4">
                <p className="fw700 fs18">ברכות קבלה</p>
                <p className="fs14 fw500" style={{ color: "#777" }}>
                  הגבירו מעורבות עם ברכה מותאמת אישית למבקרים חדשים.
                </p>
              </div>

              <div className="rtl">
                <div className="mb-4">
                  <Form.Check
                    type="switch"
                    id="enableWelcomeMessage"
                    checked={welcomeSettings.enableWelcomeMessage}
                    onChange={(e) => {
                      setWelcomeSettings((prev) => ({
                        ...prev,
                        enableWelcomeMessage: e.target.checked,
                      }));
                    }}
                    label="אפשר הודעת ברוך הבא"
                    className="fs14 rtl"
                  />
                </div>

                <div className="mb-4">
                  <Input
                    type="textarea"
                    label="תוכן ההודעה"
                    id="welcomeMessage"
                    placeholder="היי! איך אפשר לעזור היום?"
                    name="welcomeMessage"
                    value={welcomeSettings.welcomeMessage}
                    onChange={(e) => {
                      setWelcomeSettings((prev) => ({
                        ...prev,
                        welcomeMessage: e.target.value,
                      }));
                    }}
                    disabled={!welcomeSettings.enableWelcomeMessage}
                    style={{
                      minHeight: "100px",
                      resize: "vertical",
                      direction: "rtl",
                    }}
                  />
                </div>

                <div className="d mb-4">
                  <div>
                    <Input
                      type="number"
                      label="תדירות הודעת ברוך הבא לפי ימים"
                      id="messageFrequency"
                      name="messageFrequency"
                      value={welcomeSettings.messageFrequency}
                      min="1"
                      onChange={(e) => {
                        setWelcomeSettings((prev) => ({
                          ...prev,
                          messageFrequency: parseInt(e.target.value) || 1,
                        }));
                      }}
                      disabled={!welcomeSettings.enableWelcomeMessage}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      label="עיכוב הודעה (בשניות)"
                      id="messageDelay"
                      name="messageDelay"
                      value={welcomeSettings.messageDelay}
                      min="0"
                      onChange={(e) => {
                        setWelcomeSettings((prev) => ({
                          ...prev,
                          messageDelay: parseInt(e.target.value) || 0,
                        }));
                      }}
                      disabled={!welcomeSettings.enableWelcomeMessage}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="primary-button"
                    style={{
                      minWidth: "120px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#25D366",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    {isSubmitting ? (
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        שומר...
                      </div>
                    ) : (
                      "שמור"
                    )}
                  </Button>

                  {/* Add the Editor URL link */}
                  {isSubmitSuccessful && (
                    <a
                      href={getWhatsAppEditorUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-block text-center mt-3"
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#FFC107",
                        color: "#0D0D0D",
                        textDecoration: "none",
                        borderRadius: "5px",
                        fontWeight: "bold",
                        width: "fit-content",
                      }}
                    >
                      עבור לערכת הנושא
                    </a>
                  )}
                </div>
              </div>
            </div>

           
          </div>
        </div>