package com.tablemint.common.error;

public class DomainException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Object[] messageArgs;

    public DomainException(ErrorCode errorCode, Object... messageArgs) {
        super(errorCode.name());
        this.errorCode = errorCode;
        this.messageArgs = messageArgs != null ? messageArgs : new Object[0];
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Object[] getMessageArgs() {
        return messageArgs;
    }
}
